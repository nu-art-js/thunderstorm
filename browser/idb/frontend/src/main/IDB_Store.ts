/*
 * @nu-art/idb-frontend - IndexedDB infrastructure for frontend applications
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Logger, MUSTNeverHappenException} from '@nu-art/ts-common';
import {IndexDb_Query, IndexKeys, ReduceFunction} from '@nu-art/idb-shared';
import type {IDB_Database} from './IDB_Database.js';
import {IDB_StoreIndex, IndexConfig, IndexDefinition, IndexKeys as StoreIndexKeys, IndexQueryExecutor} from './IDB_StoreIndex.js';


/** LocalStorage key prefixes for sync metadata */
const SYNC_KEY_PREFIX = 'idb-sync--';
const VERSION_KEY_PREFIX = 'idb-version--';

/**
 * Store configuration - simplified from DBConfig (no group needed)
 */
export type StoreConfig<ItemType extends object> = {
	name: string;
	uniqueKeys: (keyof ItemType)[];
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

	async count(): Promise<number> {
		const store = await this.getStore();

		return new Promise((resolve, reject) => {
			const request = store.count();
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => {
				this.logError(`Failed getting count`);
				resolve(-1);
			};
		});
	}

	private async getCursor(query?: IndexDb_Query): Promise<IDBRequest<IDBCursorWithValue | null>> {
		const store = await this.getStore();

		if (query?.indexKey) {
			const idbIndex = store.index(query.indexKey);
			if (!idbIndex)
				throw new MUSTNeverHappenException(`Index "${query.indexKey}" not found`);

			return idbIndex.openCursor();
		}

		return store.openCursor();
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

	async get(key: IndexKeys<ItemType, keyof ItemType>): Promise<ItemType | undefined> {
		const keyValues = this.config.uniqueKeys.map(k => key[k]);
		const store = await this.getStore();

		return new Promise((resolve, reject) => {
			const request = store.get(keyValues as IDBValidKey);
			request.onerror = () => reject(new Error(`Error getting from "${this.config.name}"`));
			request.onsuccess = () => resolve(this.upgradeItem(request.result));
		});
	}

	async getAll(): Promise<ItemType[]> {
		const store = await this.getStore();

		return new Promise((resolve, reject) => {
			const request = store.getAll();
			request.onerror = () => reject(new Error(`Error getting all from "${this.config.name}"`));
			request.onsuccess = () => resolve(this.upgradeAll(request.result));
		});
	}

	async query(query: IndexDb_Query): Promise<ItemType[]> {
		const store = await this.getStore();

		return new Promise((resolve, reject) => {
			let request: IDBRequest;

			if (query.indexKey)
				request = store.index(query.indexKey).getAll(query.query, query.limit);
			else
				request = store.getAll(query.query, query.limit);

			request.onsuccess = () => resolve(this.upgradeAll(request.result));
			request.onerror = () => reject(new Error(`Error querying "${this.config.name}"`));
		});
	}

	async queryFilter(filter: (item: ItemType) => boolean, query?: IndexDb_Query): Promise<ItemType[]> {
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

	async queryFind(filter: (item: ItemType) => boolean): Promise<ItemType | undefined> {
		let match: ItemType | undefined;
		const cursorRequest = await this.getCursor();

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

	async queryMap<T>(mapper: (item: ItemType) => T, filter?: (item: ItemType) => boolean, query?: IndexDb_Query): Promise<T[]> {
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

	async queryReduce<T>(reducer: ReduceFunction<ItemType, T>, initialValue: T, filter?: (item: ItemType) => boolean, query?: IndexDb_Query): Promise<T> {
		const items = await this.queryFilter(filter ?? (() => true), query);
		return items.reduce((acc, item, index, arr) => reducer(acc, item, index, arr), initialValue);
	}

	// ==================== Private Index Methods ====================
	// These are called via indexQueryExecutor by IDB_StoreIndex

	private async indexGetAll(indexName: string, value: IDBValidKey, limit?: number): Promise<ItemType[]> {
		const store = await this.getStore();

		return new Promise((resolve, reject) => {
			const index = store.index(indexName);
			if (!index)
				return reject(new MUSTNeverHappenException(`Index "${indexName}" not found`));

			const request = index.getAll(value, limit);
			request.onsuccess = () => resolve(this.upgradeAll(request.result));
			request.onerror = () => reject(new Error(`Error getting from index "${indexName}" on "${this.config.name}"`));
		});
	}

	private async indexCount(indexName: string, value: IDBValidKey): Promise<number> {
		const store = await this.getStore();

		return new Promise((resolve, reject) => {
			const index = store.index(indexName);
			if (!index)
				return reject(new MUSTNeverHappenException(`Index "${indexName}" not found`));

			const request = index.count(value);
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(new Error(`Error counting index "${indexName}" on "${this.config.name}"`));
		});
	}

	private async indexFilter(indexName: string, value: IDBValidKey, filter: (item: ItemType) => boolean, limit?: number): Promise<ItemType[]> {
		const store = await this.getStore();
		const matches: ItemType[] = [];
		const effectiveLimit = limit ?? 0;

		return new Promise((resolve, reject) => {
			const index = store.index(indexName);
			if (!index)
				return reject(new MUSTNeverHappenException(`Index "${indexName}" not found`));

			const request = index.openCursor(value);

			request.onsuccess = (event) => {
				const cursor: IDBCursorWithValue = (event.target as IDBRequest).result;

				if (!cursor || (effectiveLimit > 0 && matches.length >= effectiveLimit))
					return resolve(matches);

				const item = this.upgradeItem(cursor.value);
				if (filter(item))
					matches.push(item);

				cursor.continue();
			};

			request.onerror = () => reject(new Error(`Error filtering index "${indexName}" on "${this.config.name}"`));
		});
	}

	private async indexFind(indexName: string, value: IDBValidKey, filter: (item: ItemType) => boolean): Promise<ItemType | undefined> {
		const store = await this.getStore();

		return new Promise((resolve, reject) => {
			const index = store.index(indexName);
			if (!index)
				return reject(new MUSTNeverHappenException(`Index "${indexName}" not found`));

			const request = index.openCursor(value);

			request.onsuccess = (event) => {
				const cursor: IDBCursorWithValue = (event.target as IDBRequest).result;

				if (!cursor)
					return resolve(undefined);

				const item = this.upgradeItem(cursor.value);
				if (filter(item))
					return resolve(item);

				cursor.continue();
			};

			request.onerror = () => reject(new Error(`Error finding in index "${indexName}" on "${this.config.name}"`));
		});
	}

	private async indexMap<T>(indexName: string, value: IDBValidKey, mapper: (item: ItemType) => T, filter?: (item: ItemType) => boolean): Promise<T[]> {
		const store = await this.getStore();
		const results: T[] = [];

		return new Promise((resolve, reject) => {
			const index = store.index(indexName);
			if (!index)
				return reject(new MUSTNeverHappenException(`Index "${indexName}" not found`));

			const request = index.openCursor(value);

			request.onsuccess = (event) => {
				const cursor: IDBCursorWithValue = (event.target as IDBRequest).result;

				if (!cursor)
					return resolve(results);

				const item = this.upgradeItem(cursor.value);
				if (!filter || filter(item))
					results.push(mapper(item));

				cursor.continue();
			};

			request.onerror = () => reject(new Error(`Error mapping index "${indexName}" on "${this.config.name}"`));
		});
	}

	private async indexReduce<T>(indexName: string, value: IDBValidKey, reducer: ReduceFunction<ItemType, T>, initialValue: T, filter?: (item: ItemType) => boolean): Promise<T> {
		const items = await this.indexFilter(indexName, value, filter ?? (() => true));
		return items.reduce((acc, item, index, arr) => reducer(acc, item, index, arr), initialValue);
	}

	async delete(key: IndexKeys<ItemType, keyof ItemType> | ItemType): Promise<ItemType> {
		const keyValues = this.config.uniqueKeys.map(k => key[k]);
		const store = await this.getStore(true);

		return new Promise((resolve, reject) => {
			const getRequest = store.get(keyValues as IDBValidKey);

			getRequest.onerror = () => reject(new Error(`Error getting item for delete in "${this.config.name}"`));

			getRequest.onsuccess = () => {
				const item = this.upgradeItem(getRequest.result);

				// @ts-ignore - check __updated for optimistic concurrency
				if (key.__updated !== undefined && item?.__updated > key.__updated)
					return resolve(item);

				const deleteRequest = store.delete(keyValues as IDBValidKey);
				deleteRequest.onerror = () => reject(new Error(`Error deleting from "${this.config.name}"`));
				deleteRequest.onsuccess = () => resolve(item);
			};
		});
	}

	async deleteAll(keys: (IndexKeys<ItemType, keyof ItemType> | ItemType)[]): Promise<ItemType[]> {
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
		localStorage.setItem(this.lastSyncKey, String(timestamp));
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
