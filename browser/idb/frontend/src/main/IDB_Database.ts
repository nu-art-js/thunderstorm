/*
 * @nu-art/idb-frontend - IndexedDB infrastructure for frontend applications
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {AsyncVoidFunction, currentTimeMillis, generateHex} from '@nu-art/ts-common';
import {Logger, LogLevel} from '@nu-art/logger';
import {IDB_Store, StoreConfig} from './IDB_Store.js';


/** LocalStorage key prefix for database store registry */
export const StorageKeyPrefix_DBStores = 'idb-stores--';

//@ts-ignore - set IDBAPI as indexedDB regardless of browser
const IDBAPI: IDBFactory = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

type StoreRegistry = {
	stores: string[];       // Store names
	hash: string;           // Hash of store configs for change detection
	version: number;        // IDB version
};

/** Registry: one IDB_Database instance per database name so multiple stores can share the same DB */
const dbByName: Map<string, IDB_Database> = new Map();

/**
 * Return the same IDB_Database instance for a given name. Use this when multiple stores
 * (e.g. from different modules) must live in the same IndexedDB database.
 */
export function getDatabase(dbName: string): IDB_Database {
	let db = dbByName.get(dbName);
	if (!db) {
		db = new IDB_Database(dbName);
		dbByName.set(dbName, db);
	}
	return db;
}

/**
 * IDB_Database - Direct database instantiation pattern
 *
 * Usage:
 * ```typescript
 * const db = new IDB_Database('my-database');
 *
 * const userStore = db.createStore<User>({
 *   name: 'users',
 *   uniqueKeys: ['_id'],
 *   indices: [{id: 'by-email', keys: 'email', params: {unique: true}}]
 * });
 *
 * await db.open();
 * ```
 *
 * For multiple stores in the same DB, use getDatabase('my-database') so they share one instance.
 */
export class IDB_Database
	extends Logger {

	private readonly dbName: string;
	private db!: IDBDatabase;
	private openPromise?: Promise<IDB_Database>;

	// Store management
	private readonly stores: Map<string, IDB_Store<any>> = new Map();
	private readonly storeConfigs: Map<string, StoreConfig<any>> = new Map();
	private readonly onOpenCallbacks: Map<string, AsyncVoidFunction> = new Map();

	// LocalStorage key for this database's store registry
	private readonly registryKey: string;


	constructor(dbName: string) {
		super(`IDB-${dbName}`);
		this.setMinLevel(LogLevel.Info);
		this.dbName = dbName;
		this.registryKey = `${StorageKeyPrefix_DBStores}${dbName}`;
	}

	/**
	 * Open the database connection.
	 *
	 * Automatically handles version upgrades when stores are added/changed.
	 */
	async open(): Promise<IDB_Database> {
		if (this.db) {
			this.logDebug(`[OPEN] Already open`);
			return this;
		}

		if (this.openPromise) {
			this.logDebug(`[OPEN] Awaiting existing open promise`);
			return this.openPromise;
		}

		if (!IDBAPI)
			throw new Error('IndexedDB not supported in this browser');

		return this.openPromise = this._openImpl();
	}

	/**
	 * Close the database connection.
	 */
	close(): void {
		if (!this.db)
			return;

		this.logInfo(`Database closing...`);
		this.db.close();
		this.logInfo(`Database closed`);
	}

	/**
	 * Delete the entire database.
	 */
	async deleteDatabase(): Promise<void> {
		this.close();

		this.logInfo(`Deleting database`);
		return new Promise((resolve, reject) => {
			const request = IDBAPI.deleteDatabase(this.dbName);
			request.onsuccess = () => {
				localStorage.removeItem(this.registryKey);
				this.logInfo(`Database deleted`);
				resolve();
			};
			request.onerror = () => reject(request.error);
		});
	}

	/**
	 * Create and register a store on this database.
	 *
	 * Call this before `open()` to ensure the store exists when the database opens.
	 */
	createStore<ItemType extends object>(config: StoreConfig<ItemType>, onOpenCallback?: AsyncVoidFunction): IDB_Store<ItemType> {
		if (this.db)
			throw new Error(`Cannot create store "${config.name}" - database already open. Create stores before calling open().`);

		if (this.stores.has(config.name))
			throw new Error(`Store "${config.name}" already registered on database "${this.dbName}"`);

		const store = new IDB_Store<ItemType>(config, this);
		this.stores.set(config.name, store);
		this.storeConfigs.set(config.name, config);

		if (onOpenCallback)
			this.onOpenCallbacks.set(config.name, onOpenCallback);

		this.logDebug(`[CREATE-STORE] Registered: ${config.name}`, `Keys: ${config.uniqueKeys.join(', ')}`);

		return store;
	}


	private async _openImpl(): Promise<IDB_Database> {
		const start = currentTimeMillis();
		const openId = generateHex(6);
		this.logInfo(`Opening Database`);


		// Determine version based on store changes
		const currentRegistry = this.loadRegistry();
		const newHash = this.computeStoreHash();
		const needsUpgrade = !currentRegistry || currentRegistry.hash !== newHash;
		const version = needsUpgrade ? (currentRegistry?.version ?? 0) + 1 : currentRegistry?.version;

		this.logDebug(`Version: ${version}, NeedsUpgrade: ${needsUpgrade}`);

		return new Promise((resolve, reject) => {
			const request = IDBAPI.open(this.dbName, version);

			request.onblocked = (e) => {
				this.logWarningBold(`Blocked - another tab holds the connection`, e);
			};

			request.onupgradeneeded = () => {
				const db = request.result;
				this.logInfo(`Upgrade needed - creating/updating stores`);

				// Create stores that don't exist
				for (const [name, config] of this.storeConfigs) {
					if (db.objectStoreNames.contains(name)) {
						this.logDebug(`Store "${name}" already exists`);
						continue;
					}

					const options: IDBObjectStoreParameters = {
						autoIncrement: config.autoIncrement ?? false,
						keyPath: config.uniqueKeys as unknown as string[]
					};

					const idbStore = db.createObjectStore(name, options);
					this.logDebug(`Created store: ${name}`);

					// Create indices from store's index definitions
					const storeInstance = this.stores.get(name);
					const indexDefs = storeInstance?.getIndexDefinitions() ?? [];
					indexDefs.forEach(indexDef => {
						// Handle both single key and compound keys (array)
						const keyPath = Array.isArray(indexDef.keys)
							? indexDef.keys as string[]
							: indexDef.keys as string;
						idbStore.createIndex(indexDef.name, keyPath, {
							multiEntry: indexDef.config?.multiEntry,
							unique: indexDef.config?.unique
						});
						this.logDebug(`Created index: ${indexDef.name} on ${name}`);
					});
				}

				// Save updated registry
				this.saveRegistry({
					stores: Array.from(this.storeConfigs.keys()),
					hash: newHash,
					version: version!
				});
			};

			request.onsuccess = async () => {
				const elapsed = currentTimeMillis() - start;
				this.db = request.result;
				this.logInfo(`Success - ${this.db.objectStoreNames.length} stores (${elapsed}ms)`);

				// Setup lifecycle handlers
				this.db.onversionchange = () => {
					this.logWarningBold(`Version change detected - closing`);
					this.db.close();
				};
				this.db.onclose = () => this.logInfo(`Connection closed`);
				this.db.onerror = (e) => this.logErrorBold(`Database error`, e);

				// Run open callbacks
				await this.runOpenCallbacks(openId);

				delete this.openPromise;
				resolve(this);
			};

			request.onerror = (e) => {
				this.logErrorBold(`Failed to open`, e);
				delete this.openPromise;
				reject(request.error);
			};
		});
	}

	private async runOpenCallbacks(openId: string): Promise<void> {
		if (this.onOpenCallbacks.size === 0)
			return;

		this.logInfo(`Running ${this.onOpenCallbacks.size} open callbacks`);

		for (const [storeName, callback] of this.onOpenCallbacks) {
			const start = currentTimeMillis();
			try {
				await callback();
				this.logDebug(`Callback for "${storeName}" completed (${currentTimeMillis() - start}ms)`);
			} catch (err) {
				this.logErrorBold(`Callback for "${storeName}" failed`, err as Error);
				throw err;
			}
		}
	}

	/**
	 * Get an IDBObjectStore for direct operations.
	 * @internal Used by IDB_Store
	 */
	async getObjectStore(storeName: string, write: boolean = false): Promise<IDBObjectStore> {
		await this.open();
		const tx = this.db.transaction(storeName, write ? 'readwrite' : 'readonly');
		return tx.objectStore(storeName);
	}

	/**
	 * Check if a store exists in the database.
	 */
	async storeExists(storeName: string): Promise<boolean> {
		await this.open();
		return this.db.objectStoreNames.contains(storeName);
	}

	/**
	 * Get a registered store by name.
	 */
	getStore<ItemType extends object>(name: string): IDB_Store<ItemType> | undefined {
		return this.stores.get(name);
	}

	private loadRegistry(): StoreRegistry | null {
		const raw = localStorage.getItem(this.registryKey);
		if (!raw)
			return null;

		try {
			return JSON.parse(raw);
		} catch {
			return null;
		}
	}

	private saveRegistry(registry: StoreRegistry): void {
		localStorage.setItem(this.registryKey, JSON.stringify(registry));
	}

	private computeStoreHash(): string {
		// Create a deterministic hash from store configs and index definitions
		const configStrings = Array.from(this.storeConfigs.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([name, config]) => {
				// Get index definitions from the store instance
				const storeInstance = this.stores.get(name);
				const indexDefs = storeInstance?.getIndexDefinitions() ?? [];
				const indices = indexDefs
					.map(i => {
						// Handle both single key and compound keys
						const keysStr = Array.isArray(i.keys)
							? `[${i.keys.map(String).join(',')}]`
							: String(i.keys);
						return `${i.name}:${keysStr}:${JSON.stringify(i.config ?? {})}`;
					})
					.sort()
					.join(',');
				return `${name}|${config.uniqueKeys.join(',')}|${config.autoIncrement ?? false}|${indices}`;
			})
			.join(';;');

		// Simple hash function
		let hash = 0;
		for (let i = 0; i < configStrings.length; i++) {
			const char = configStrings.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash;
		}
		return hash.toString(16);
	}
}
