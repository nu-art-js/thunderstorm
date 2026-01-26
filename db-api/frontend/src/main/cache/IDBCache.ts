/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Logger, LogLevel} from '@nu-art/ts-common';
import {IDBManager, IndexDb_Query, IndexedDB_Store, IndexKeys, ReduceFunction} from '@nu-art/idb-frontend';
import {DB_Object, DBConfig} from '../to-refactor/db-types.js';
import {StorageKey} from '../to-refactor/storage-key.js';


/**
 * IndexedDB cache wrapper for database entities.
 *
 * Provides persistent storage using IndexedDB with automatic version
 * management and synchronization tracking.
 *
 * @template Proto - Database prototype type
 */
export class IDBCache<ItemType extends object>
	extends Logger {

	readonly storeWrapper!: IndexedDB_Store<ItemType>;
	protected lastSync: StorageKey<number>;
	protected readonly lastVersion: StorageKey<string>;
	private dbConfig: DBConfig<ItemType>;
	private initialized: boolean = false;

	constructor(dbConfig: DBConfig<ItemType>, dbKey: string) {
		super(`idb-cache-${dbKey}`);
		this.dbConfig = dbConfig;
		this.setMinLevel(LogLevel.Verbose);
		this.lastSync = new StorageKey<number>('last-sync--' + dbKey);
		this.lastVersion = new StorageKey<string>('last-version--' + dbKey);
	}

	init() {
		if (this.initialized)
			return;

		const currentVersion = this.dbConfig.version;

		const onOpenedCallback = async () => {
			const previousVersion = this.lastVersion.get();

			const exists = await this.storeWrapper.exists();
			if (!exists) {
				this.logInfo(`Database doesn't exist.. reset last sync timestamp`);
				this.lastSync.delete();
			}

			if (exists && (!previousVersion || previousVersion === currentVersion))
				return;

			this.lastSync.delete();
			this.logInfo(`Cleaning up & Sync...`);
			try {
				await this.clear();
				this.logInfo(`Cleaning up & Sync: Completed`);
			} catch (e: any) {
				this.logError(`Cleaning up & Sync: ERROR`, e);
			}
		};

		// @ts-ignore - storeWrapper is readonly but we need to set it once
		this['storeWrapper'] = IDBManager.register(this.dbConfig, onOpenedCallback);
		this.initialized = true;
	}

	protected setLastSyncTimestampStorageKey(newLastSyncStorageKey: StorageKey<number>) {
		this.lastSync = newLastSyncStorageKey;
	}

	onLastUpdateListener(onChangeListener: (after?: number, before?: number) => Promise<void>) {
		this.lastSync.onChange(onChangeListener);
	}

	forEach = async (processor: (item: ItemType) => void) => {
		const allItems = await this.query();
		allItems.forEach(processor);
		return allItems;
	};

	clear = async () => {
		this.lastSync.delete();
		return this.storeWrapper.clearStore();
	};

	delete = async () => {
		this.lastSync.delete();
		return this.storeWrapper.clearStore();
	};

	query = async (query?: string | number | string[] | number[], indexKey?: string): Promise<ItemType[]> => {
		const result = await this.storeWrapper.query({query, indexKey});
		return result || [];
	};

	/**
	 * Iterates over all DB objects and returns items that pass the filter.
	 */
	filter = async (filter: (item: ItemType) => boolean, query?: IndexDb_Query): Promise<ItemType[]> =>
		this.storeWrapper.queryFilter(filter, query);

	/**
	 * Returns the first item that passes the filter.
	 */
	find = async (filter: (item: ItemType) => boolean): Promise<ItemType | undefined> =>
		this.storeWrapper.queryFind(filter);

	/**
	 * Maps all items that pass the optional filter.
	 */
	map = async <MapType>(mapper: (item: ItemType) => MapType, filter?: (item: ItemType) => boolean, query?: IndexDb_Query): Promise<MapType[]> =>
		this.storeWrapper.WIP_queryMap(mapper, filter, query);

	/**
	 * Reduces all items to a single value.
	 */
	reduce = async <ReturnType>(reducer: ReduceFunction<ItemType, ReturnType>, initialValue: ReturnType, filter?: (item: ItemType) => boolean, query?: IndexDb_Query): Promise<ReturnType> =>
		this.storeWrapper.queryReduce(reducer, initialValue, filter, query);

	unique = async (_key?: string | IndexKeys<ItemType, keyof ItemType>): Promise<ItemType | undefined> => {
		if (_key === undefined)
			return _key;

		const key = typeof _key === 'string'
			? {_id: _key} as unknown as IndexKeys<ItemType, keyof ItemType>
			: _key;
		return this.storeWrapper.get(key);
	};

	getLastSync() {
		return this.lastSync.get(0);
	}

	setLastUpdated(lastUpdated: number) {
		this.lastSync.set(lastUpdated);
	}

	async syncIndexDb(toUpdate: ItemType[], toDelete: DB_Object[] = []) {
		await this.storeWrapper.upsertAll(toUpdate);
		await this.storeWrapper.deleteAll(toDelete as ItemType[]);
	}

	async count(): Promise<number> {
		return await this.storeWrapper.count();
	}
}
