/*
 * @nu-art/idb-frontend - IndexedDB infrastructure for frontend applications
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Logger, MUSTNeverHappenException} from '@nu-art/ts-common';
import {ReduceFunction} from '@nu-art/idb-shared';
import type {IDB_Database} from './IDB_Database.js';
import {IDB_StoreIndex, IndexConfig, IndexDefinition, IndexKeys as StoreIndexKeys, IndexQueryExecutor} from './IDB_StoreIndex.js';

/**
 * Optional query for store APIs. All store methods accept this when they support scoping/range.
 * - indexKey: use this index instead of the primary store
 * - query: key or range value (used with indexKey for index seek, or as IDBKeyRange for primary)
 * - limit: max results (where supported)
 */
export type IndexDb_Query = {
	indexKey?: string;
	query?: IDBValidKey | IDBKeyRange;
	limit?: number;
};


/** LocalStorage key prefixes for sync metadata */
const SYNC_KEY_PREFIX = 'idb-sync--';
const VERSION_KEY_PREFIX = 'idb-version--';

/**
 * Store configuration - simplified from DBConfig (no group needed)
 */
export type StoreConfig<ItemType extends object> = {
	name: string;
	uniqueKeys: (keyof ItemType | string)[];
	autoIncrement?: boolean;
	/**
	 * Upgrade processor for lazy migration.
	 * Called on each item read from the database.
	 * Use this to transform old item shapes to the current schema.
	 *
	 * @param item - The raw item from the database (may be old schema)
	 * @returns The upgraded item matching ItemType
	 */
	upgradeProcessor?: (item: ItemType) => ItemType;
};

/**
 * Object containing the store's unique-key fields, used for get/delete lookup.
 * Distinct from "index keys" (IDB_StoreIndex), which are the field(s) an index is built on.
 */
export type StoreKeyLookup<ItemType extends object, Keys extends keyof ItemType = keyof ItemType> = { [K in Keys]?: ItemType[K] };

/**
 * Clear all IDB sync metadata from localStorage for the new IDB_Store pattern.
 */
export function clearIDBStoreSyncMetadata(): void {
	const keysToRemove: string[] = [];

	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key && (key.startsWith(SYNC_KEY_PREFIX) || key.startsWith(VERSION_KEY_PREFIX)))
			keysToRemove.push(key);
	}

	keysToRemove.forEach(key => localStorage.removeItem(key));
}

/**
 * IDB_Store - Store operations for a single object store
 *
 * Created via IDB_Database.createStore()
 */
export class IDB_Store<ItemType extends object>
	extends Logger {

	private readonly config: StoreConfig<ItemType>;
	private readonly database: IDB_Database;

	// Index management
	private readonly indices: Map<string, IDB_StoreIndex<ItemType, any>> = new Map();
	private readonly indexDefinitions: Map<string, IndexDefinition<ItemType, any>> = new Map();
	private readonly indexQueryExecutor: IndexQueryExecutor<ItemType>;

	// LocalStorage keys for sync metadata
	private readonly lastSyncKey: string;
	private readonly lastVersionKey: string;

	// Listeners notified when lastSync changes (e.g. from setLastSync / setLastUpdated)
	private readonly lastSyncListeners: ((after?: number, before?: number) => void | Promise<void>)[] = [];


	constructor(config: StoreConfig<ItemType>, database: IDB_Database) {
		super(`IDB-Store-${config.name}`);
		this.config = {
			...config,
			autoIncrement: config.autoIncrement ?? false
		};
		this.database = database;

		// Initialize localStorage keys
		this.lastSyncKey = `${SYNC_KEY_PREFIX}${config.name}`;
		this.lastVersionKey = `${VERSION_KEY_PREFIX}${config.name}`;

		// Create bound executor for IDB_StoreIndex - allows private methods to be called
		this.indexQueryExecutor = {
			getAll: this.indexGetAll.bind(this),
			count: this.indexCount.bind(this),
			filter: this.indexFilter.bind(this),
			find: this.indexFind.bind(this),
			map: this.indexMap.bind(this),
			reduce: this.indexReduce.bind(this),
		};
	}

	get name(): string {
		return this.config.name;
	}

	// ==================== Index Management ====================

	/**
	 * Create a typed index accessor for querying by a specific field or compound fields.
	 *
	 * Call this before db.open() to ensure the index is created.
	 *
	 * @param name - Unique index identifier (e.g., 'by-email')
	 * @param keys - The field(s) to index (single key or array for compound index)
	 * @param config - Optional index configuration (unique, multiEntry)
	 * @returns Typed IDB_StoreIndex for querying
	 *
	 * @example
	 * ```typescript
	 * // Single key index
	 * const byEmail = store.createIndex('by-email', 'email', {unique: true});
	 * const users = await byEmail.getAll('test@example.com');
	 *
	 * // Compound key index
	 * const byNameDate = store.createIndex('by-name-date', ['lastName', 'createdAt'] as const);
	 * const users = await byNameDate.getAll(['Smith', 1234567890]);
	 * ```
	 */
	createIndex<Keys extends StoreIndexKeys<ItemType>>(name: string, keys: Keys, config?: IndexConfig): IDB_StoreIndex<ItemType, Keys> {
		if (this.indices.has(name))
			throw new Error(`Index "${name}" already exists on store "${this.config.name}"`);

		const indexDef: IndexDefinition<ItemType, any> = {name, keys: keys as any, config};
		this.indexDefinitions.set(name, indexDef);

		const index = new IDB_StoreIndex<ItemType, Keys>(this.indexQueryExecutor, name, keys, config);
		this.indices.set(name, index);

		const keyStr = Array.isArray(keys) ? `[${(keys as any[]).map(String).join(', ')}]` : String(keys);
		this.logDebug(`[CREATE-INDEX] ${name} on field(s): ${keyStr}`);

		return index;
	}

	/**
	 * Get an existing index by name.
	 */
	getIndex<Keys extends StoreIndexKeys<ItemType>>(name: string): IDB_StoreIndex<ItemType, Keys> | undefined {
		return this.indices.get(name);
	}

	/**
	 * Get all index definitions for IDB_Database to use during store creation.
	 * @internal
	 */
	getIndexDefinitions(): IndexDefinition<ItemType, any>[] {
		return Array.from(this.indexDefinitions.values());
	}

	/**
	 * Apply upgrade processor to an item if configured.
	 */
	private upgradeItem(item: ItemType): ItemType {
		if (!item)
			return item;

		return this.config.upgradeProcessor ? this.config.upgradeProcessor(item) : item;
	}

	/**
	 * Apply upgrade processor to multiple items.
	 */
	private upgradeAll(items: ItemType[]): ItemType[] {
		if (!this.config.upgradeProcessor)
			return items;

		return items.map(item => this.upgradeItem(item));
	}

	private async getStore(write: boolean = false): Promise<IDBObjectStore> {
		return this.database.getObjectStore(this.config.name, write);
	}

	async exists(): Promise<boolean> {
		return this.database.storeExists(this.config.name);
	}

	async insert(value: ItemType): Promise<ItemType> {
		const store = await this.getStore(true);

		return new Promise((resolve, reject) => {
			const request = store.add(value);
			request.onerror = () => reject(new Error(`Error inserting into "${this.config.name}"`));
			request.onsuccess = () => resolve(value);
		});
	}

	async insertAll(values: ItemType[]): Promise<void> {
		const store = await this.getStore(true);

		for (const value of values) {
			await new Promise<void>((resolve, reject) => {
				const request = store.add(value);
				request.onerror = () => reject(new Error(`Error inserting into "${this.config.name}"`));
				request.onsuccess = () => resolve();
			});
		}
	}

	async upsert(value: ItemType): Promise<ItemType> {
		const store = await this.getStore(true);

		return new Promise((resolve, reject) => {
			const request = store.put(value);
			request.onerror = () => reject(new Error(`Error upserting into "${this.config.name}"`));
			request.onsuccess = () => resolve(value);
		});
	}

	async upsertAll(values: ItemType[]): Promise<void> {
		const store = await this.getStore(true);

		for (const value of values) {
			await new Promise<void>((resolve, reject) => {
				const request = store.put(value);
				request.onerror = () => reject(new Error(`Error upserting into "${this.config.name}"`));
				request.onsuccess = () => resolve();
			});
		}
	}

	async get(key: StoreKeyLookup<ItemType>): Promise<ItemType | undefined> {
		const keyValues = this.config.uniqueKeys.map(k => key[k]);
		const store = await this.getStore();

		return new Promise((resolve, reject) => {
			const request = store.get(keyValues as IDBValidKey);
			request.onerror = () => reject(new Error(`Error getting from "${this.config.name}"`));
			request.onsuccess = () => resolve(this.upgradeItem(request.result));
		});
	}

	/** Returns the store or the named index so getAll/count/openCursor use the same target. */
	private async getTarget(query?: IndexDb_Query): Promise<IDBObjectStore | IDBIndex> {
		const store = await this.getStore();
		if (!query?.indexKey)
			return store;
		const index = store.index(query.indexKey);
		if (!index)
			throw new MUSTNeverHappenException(`Index "${query.indexKey}" not found`);
		return index;
	}

	/**
	 * Get all items, optionally scoped by index and key/range. All store read APIs use this query shape.
	 */
	async getAll(query?: IndexDb_Query): Promise<ItemType[]> {
		const target = await this.getTarget(query);

		return new Promise((resolve, reject) => {
			const request = target.getAll(query?.query, query?.limit);
			request.onsuccess = () => resolve(this.upgradeAll(request.result));
			request.onerror = () => reject(new Error(`Error getting all from "${this.config.name}"`));
		});
	}

	/**
	 * Count items, optionally scoped by index and key. Uses the same query shape as getAll/filter/etc.
	 */
	async count(query?: IndexDb_Query): Promise<number> {
		const target = await this.getTarget(query);

		return new Promise((resolve, reject) => {
			const request = target.count(query?.query);
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(new Error(`Error counting "${this.config.name}"`));
		});
	}

	async filter(filter: (item: ItemType) => boolean, query?: IndexDb_Query): Promise<ItemType[]> {
		const limit = query?.limit ?? 0;
		const cursorRequest = await this.getCursor(query);
		const matches: ItemType[] = [];

		return new Promise((resolve) => {
			this.cursorHandler(
				cursorRequest,
				(value) => {
					if (filter(value))
						matches.push(value);
				},
				() => resolve(matches),
				() => limit > 0 && matches.length >= limit
			);
		});
	}

	async find(filter: (item: ItemType) => boolean, query?: IndexDb_Query): Promise<ItemType | undefined> {
		let match: ItemType | undefined;
		const cursorRequest = await this.getCursor(query);

		return new Promise((resolve) => {
			this.cursorHandler(
				cursorRequest,
				(value) => {
					if (filter(value))
						match = value;
				},
				() => resolve(match),
				() => !!match
			);
		});
	}

	async map<T>(mapper: (item: ItemType) => T, filter?: (item: ItemType) => boolean, query?: IndexDb_Query): Promise<T[]> {
		const limit = query?.limit ?? 0;
		const cursorRequest = await this.getCursor(query);
		const results: T[] = [];

		return new Promise((resolve) => {
			this.cursorHandler(
				cursorRequest,
				(item) => {
					if (!filter || filter(item))
						results.push(mapper(item));
				},
				() => resolve(results),
				() => limit > 0 && results.length >= limit
			);
		});
	}

	async reduce<T>(reducer: ReduceFunction<ItemType, T>, initialValue: T, filter?: (item: ItemType) => boolean, query?: IndexDb_Query): Promise<T> {
		const items = await this.filter(filter ?? (() => true), query);
		return items.reduce((acc, item, index, arr) => reducer(acc, item, index, arr), initialValue);
	}

	// ==================== Cursor (shared by getAll/filter/find/map/reduce) ====================
	private async getCursor(query?: IndexDb_Query): Promise<IDBRequest<IDBCursorWithValue | null>> {
		const target = await this.getTarget(query);
		return target.openCursor(query?.query);
	}


	private cursorHandler(
		cursorRequest: IDBRequest<IDBCursorWithValue | null>,
		onValue: (value: ItemType) => void,
		onEnd: () => void,
		shouldStop?: () => boolean
	): void {
		cursorRequest.onsuccess = (event) => {
			const cursor: IDBCursorWithValue = (event.target as IDBRequest).result;

			if (!cursor || shouldStop?.())
				return onEnd();

			onValue(this.upgradeItem(cursor.value));
			cursor.continue();
		};
	}

	// ==================== Index executor: same APIs with query built from (indexName, value, limit) ====================
	private queryWithIndex(indexName: string, value: IDBValidKey, limit?: number): IndexDb_Query {
		return {indexKey: indexName, query: value, limit};
	}

	private async indexGetAll(indexName: string, value: IDBValidKey, limit?: number): Promise<ItemType[]> {
		return this.getAll(this.queryWithIndex(indexName, value, limit));
	}

	private async indexCount(indexName: string, value: IDBValidKey): Promise<number> {
		return this.count(this.queryWithIndex(indexName, value));
	}

	private async indexFilter(indexName: string, value: IDBValidKey, filter: (item: ItemType) => boolean, limit?: number): Promise<ItemType[]> {
		return this.filter(filter, this.queryWithIndex(indexName, value, limit));
	}

	private async indexFind(indexName: string, value: IDBValidKey, filter: (item: ItemType) => boolean): Promise<ItemType | undefined> {
		return this.find(filter, this.queryWithIndex(indexName, value));
	}

	private async indexMap<T>(indexName: string, value: IDBValidKey, mapper: (item: ItemType) => T, filter?: (item: ItemType) => boolean): Promise<T[]> {
		return this.map(mapper, filter, this.queryWithIndex(indexName, value));
	}

	private async indexReduce<T>(indexName: string, value: IDBValidKey, reducer: ReduceFunction<ItemType, T>, initialValue: T, filter?: (item: ItemType) => boolean): Promise<T> {
		return this.reduce(reducer, initialValue, filter ?? (() => true), this.queryWithIndex(indexName, value));
	}

	async delete(key: StoreKeyLookup<ItemType> | ItemType): Promise<ItemType> {
		const keyValues = this.config.uniqueKeys.map(k => key[k]);
		const store = await this.getStore(true);

		return new Promise((resolve, reject) => {
			const getRequest = store.get(keyValues as IDBValidKey);

			getRequest.onerror = () => reject(new Error(`Error getting item for delete in "${this.config.name}"`));

			getRequest.onsuccess = () => {
				const item = this.upgradeItem(getRequest.result);

				const deleteRequest = store.delete(keyValues as IDBValidKey);
				deleteRequest.onerror = () => reject(new Error(`Error deleting from "${this.config.name}"`));
				deleteRequest.onsuccess = () => resolve(item);
			};
		});
	}

	async deleteAll(keys: (StoreKeyLookup<ItemType> | ItemType)[]): Promise<ItemType[]> {
		return Promise.all(keys.map(key => this.delete(key)));
	}

	async clearStore(): Promise<void> {
		if (!(await this.exists()))
			return;

		const store = await this.getStore(true);

		return new Promise((resolve, reject) => {
			const request = store.clear();
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	getLastSync(defaultValue: number = 0): number {
		const value = localStorage.getItem(this.lastSyncKey);
		if (value === null)
			return defaultValue;

		const parsed = parseInt(value, 10);
		return isNaN(parsed) ? defaultValue : parsed;
	}

	setLastSync(timestamp: number): void {
		const before = this.getLastSync();
		localStorage.setItem(this.lastSyncKey, String(timestamp));
		this.lastSyncListeners.forEach(listener => {
			try {
				listener(timestamp, before);
			} catch (e: any) {
				this.logError('lastSync listener error', e);
			}
		});
	}

	/**
	 * Alias for setLastSync for consumers that use "last updated" wording.
	 */
	setLastUpdated(timestamp: number): void {
		this.setLastSync(timestamp);
	}

	/**
	 * Register a listener to run when lastSync / lastUpdated changes.
	 */
	onLastUpdateListener(listener: (after?: number, before?: number) => void | Promise<void>): void {
		this.lastSyncListeners.push(listener);
	}

	/**
	 * Open the database. Call before using the store.
	 */
	async open(): Promise<void> {
		await this.database.open();
	}

	/**
	 * Upsert items and delete others in one call. Convenience for sync flows.
	 */
	async syncIndexDb(toUpdate: ItemType[], toDelete: ItemType[] = []): Promise<void> {
		await this.upsertAll(toUpdate);
		if (toDelete.length)
			await this.deleteAll(toDelete);
	}

	getLastVersion(): string | null {
		return localStorage.getItem(this.lastVersionKey);
	}

	setLastVersion(version: string): void {
		localStorage.setItem(this.lastVersionKey, version);
	}

	clearSyncMetadata(): void {
		localStorage.removeItem(this.lastSyncKey);
		localStorage.removeItem(this.lastVersionKey);
	}

	/**
	 * Clear store data AND sync metadata.
	 */
	async clearAll(): Promise<void> {
		this.clearSyncMetadata();
		await this.clearStore();
	}
}
