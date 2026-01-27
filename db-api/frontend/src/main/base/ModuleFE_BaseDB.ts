/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {
	_keys,
	deleteKeysObject,
	exists,
	filterDuplicates,
	InvalidResult,
	lastElement,
	MemCache,
	Module,
	tsValidateResult,
	ValidationException,
	voidFunction
} from '@nu-art/ts-common';
import {getDatabase, IDB_Store} from '@nu-art/idb-frontend';
import {
	DataStatus,
	EventType_Create,
	EventType_Delete,
	EventType_DeleteMulti,
	EventType_Patch,
	EventType_Query,
	EventType_Unique,
	EventType_Update,
	EventType_UpsertAll,
	MultiApiEvent,
	SingleApiEvent
} from '../to-refactor/consts.js';
import {DB_Object, DBConfig, KeysOfDB_Object} from '../to-refactor/db-types.js';
import {EventDispatcher, NoOpDispatcher} from '../to-refactor/dispatcher.js';
import {composeDbObjectUniqueId, dbObjectToId} from '../to-refactor/utils.js';
import {BaseDBConfig, ModuleTypes} from './types.js';


/**
 * Converts DBConfig (db-api shape) to StoreConfig (idb-frontend shape).
 */
function dbConfigToStoreConfig<ItemType extends object>(dbConfig: DBConfig<ItemType>): {
	name: string;
	uniqueKeys: (keyof ItemType)[];
	autoIncrement?: boolean;
} {
	return {
		name: dbConfig.name,
		uniqueKeys: dbConfig.uniqueKeys,
		autoIncrement: dbConfig.autoIncrement
	};
}


/**
 * Sync type for frontend modules.
 */
export enum ModuleSyncType {
	NoSync,
	CSVSync,
	APISync
}

/**
 * Base database module for frontend.
 *
 * Provides core functionality for managing database entities in the frontend:
 * - In-memory caching (MemCache) for fast synchronous access
 * - IndexedDB persistence (IDBCache) for offline support
 * - Event dispatching for UI/module updates
 * - Version upgrade processing
 * - Validation
 *
 * @template Types - ModuleTypes that define the entity types (decoupled from Proto)
 */
export class ModuleFE_BaseDB<Types extends ModuleTypes>
	extends Module {

	readonly validator: Types['validator'];
	readonly cache: MemCache<Types['dbItem']>;
	readonly config: BaseDBConfig<Types>;
	readonly syncType: ModuleSyncType;
	readonly IDB: IDB_Store<Types['dbItem']>;

	private dataStatus: DataStatus = DataStatus.NoData;
	private dispatcher: EventDispatcher;

	// Version upgrade processors - maps version string to upgrade function
	private versionUpgrades: Record<string, (items: Types['dbItem'][]) => Promise<void>> = {};

	protected constructor(
		config: BaseDBConfig<Types>,
		syncType: ModuleSyncType    = ModuleSyncType.APISync,
		dispatcher: EventDispatcher = NoOpDispatcher
	) {
		super(`BaseDB-${config.dbKey}`);
		this.config = config;
		this.syncType = syncType;
		this.dispatcher = dispatcher;
		this.validator = config.validator;

		// Initialize caches (ts-common MemCache with DB id logic from to-refactor)
		const uniqueKeys = config.uniqueKeys;
		this.cache = new MemCache<Types['dbItem']>({
			getId: (item) => dbObjectToId(item as {_id: string}),
			keyToId: (key) => typeof key === 'string' ? key : composeDbObjectUniqueId(key as Types['dbItem'], uniqueKeys)
		});

		// IDB: one database instance per group so multiple stores share the same DB
		const db = getDatabase(config.dbConfig.group);
		const storeConfig = dbConfigToStoreConfig(config.dbConfig);
		const currentVersion = config.versions[0] ?? '';

		const store = db.createStore(storeConfig, async (): Promise<void> => {
			const previousVersion = store.getLastVersion();
			const storeExists = await store.exists();
			if (!storeExists)
				return;
			if (storeExists && (!previousVersion || previousVersion === currentVersion))
				return;
			await store.clearAll();
			store.setLastVersion(currentVersion);
		}) as IDB_Store<Types['dbItem']>;

		if (config.dbConfig.indices?.length) {
			for (const idx of config.dbConfig.indices) {
				const keys = idx.keys;
				const params = idx.params ? {unique: idx.params.unique, multiEntry: idx.params.multiEntry} : undefined;
				store.createIndex(idx.id, keys as string | string[], params);
			}
		}

		this.IDB = store;
	}

	/**
	 * Initialize the module. Must be called before use.
	 */
	async init(): Promise<void> {
		await this.IDB.open();
		this.attachOnLastSyncUpdatedListener();
	}


	setDispatcher(dispatcher: EventDispatcher) {
		this.dispatcher = dispatcher;
	}

	private dispatchSingle = (event: SingleApiEvent, item: Types['dbItem']) => {
		this.dispatcher.dispatchModule(event, item);
		this.dispatcher.dispatchUI(event, item);
	};

	private dispatchMulti = (event: MultiApiEvent, items: Types['dbItem'][]) => {
		this.dispatcher.dispatchModule(event, items);
		this.dispatcher.dispatchUI(event, items);
	};


	setDataStatus(status: DataStatus) {
		this.logDebug(`Data status updated: ${DataStatus[this.dataStatus]} => ${DataStatus[status]}`);
		if (this.dataStatus === status)
			return;

		this.dataStatus = status;
	}

	getDataStatus() {
		return this.dataStatus;
	}


	attachOnLastSyncUpdatedListener = () => {
		this.IDB.onLastUpdateListener(this.onLastSyncUpdatedListener);
	};

	detachOnLastSyncUpdatedListener = () => {
		this.IDB.onLastUpdateListener(voidFunction);
	};

	private onLastSyncUpdatedListener = async (after?: number, before?: number) => {
		if (!exists(after) || after === before)
			return;

		await this.loadCache();
		this.dispatcher.dispatchAll('update', {} as Types['dbItem']);
	};


	async loadCache(cacheFilter?: (item: Readonly<Types['dbItem']>) => boolean) {
		this.logDebug(`Cache is loading`);

		if (cacheFilter)
			this.cache.setCacheFilter(cacheFilter);

		const existingFilter = this.cache.getCacheFilter();
		let allItems: Types['dbItem'][];

		if (existingFilter)
			allItems = await this.IDB.filter(existingFilter);
		else
			allItems = await this.IDB.getAll();

		// Upgrade items
		await this.upgradeInstances(allItems);

		this.cache.load(allItems);
		this.logDebug(`Cache finished loading, count: ${this.cache.all().length}`);
	}


	/**
	 * Register a version upgrade processor.
	 *
	 * @param version - The version string to upgrade from
	 * @param processor - Function to transform items from this version
	 */
	registerVersionUpgradeProcessor(
		version: string,
		processor: (items: Types['dbItem'][]) => Promise<void>
	) {
		this.versionUpgrades[version] = processor;
	}

	async upgradeInstances(instances: Types['dbItem'][], force = false): Promise<Types['dbItem'][]> {
		if (!_keys(this.versionUpgrades).length) {
			this.logVerbose(`No registered upgrade processors for module ${this.config.dbKey}`);
			return instances;
		}

		// Ensure all items have a version
		const latestVersion = lastElement(this.config.versions);
		if (latestVersion) {
			instances.forEach(instance => {
				if (!instance._v)
					instance._v = latestVersion;
			});
		}

		let instancesToSave: Types['dbItem'][] = [];

		for (let i = this.config.versions.length - 1; i >= 0; i--) {
			const version = this.config.versions[i];
			const instancesToUpgrade = instances.filter(instance => instance._v === version);
			const nextVersion = this.config.versions[i - 1] ?? version;
			const versionTransition = `${version} => ${nextVersion}`;

			if (instancesToUpgrade.length === 0) {
				this.logVerbose(`No instances to upgrade from ${versionTransition}`);
				continue;
			}

			const upgradeProcessor = this.versionUpgrades[version];
			if (!upgradeProcessor) {
				this.logVerbose(`No upgrade processor for: ${versionTransition}`);
			} else {
				this.logVerbose(`Upgrade instances(${instancesToUpgrade.length}): ${versionTransition}`);
				await upgradeProcessor(instancesToUpgrade);
				instancesToSave.push(...instancesToUpgrade);
			}

			instancesToSave = filterDuplicates(instancesToSave);
			instancesToUpgrade.forEach(instance => instance._v = nextVersion);
		}

		return force ? instances : instancesToSave;
	}


	validateImpl(_instance: Partial<Types['uiItem']>) {
		// UIItem is well-defined at app level and already excludes generated props
		// Just remove DB_Object keys before validation
		const instance = deleteKeysObject(_instance as Types['dbItem'], KeysOfDB_Object);
		const results = tsValidateResult(instance, this.validator);
		if (results)
			this.onValidationError(_instance as Types['uiItem'], results as InvalidResult<Types['dbItem']>);
	}

	protected validateInternal(_instance: Partial<Types['uiItem']>) {
		this.validateImpl(_instance);
	}

	protected onValidationError(instance: Types['uiItem'], results: InvalidResult<Types['uiItem']>) {
		this.logError(`Error validating object:`, instance, 'With Error: ', results);
		throw new ValidationException('Error validating object', instance, results);
	}


	/**
	 * Handle multiple entries being deleted.
	 */
	onEntriesDeleted = async (items: Types['dbItem'][]): Promise<void> => {
		await this.IDB.syncIndexDb([], items);
		this.cache.onEntriesDeleted(items);
		this.dispatchMulti(EventType_DeleteMulti, items);
	};

	/**
	 * Handle a single entry being deleted.
	 */
	protected onEntryDeleted = async (item: Types['dbItem']): Promise<void> => {
		await this.IDB.syncIndexDb([], [item]);
		this.cache.onEntriesDeleted([item]);
		this.dispatchSingle(EventType_Delete, item);
	};

	/**
	 * Handle multiple entries being updated.
	 */
	onEntriesUpdated = async (items: Types['dbItem'][], updateIDBLastSynced: boolean = true): Promise<void> => {
		items = await this.upgradeInstances(items);
		await this.IDB.syncIndexDb(items);
		this.cache.onEntriesUpdated(items);

		// Update the collection last updated timestamp
		const lastUpdated = items.reduce((toRet, current) => Math.max(toRet, current.__updated), 0);
		if ((!this.IDB.getLastSync() && lastUpdated !== 0 || lastUpdated) && updateIDBLastSynced)
			this.IDB.setLastUpdated(lastUpdated);

		this.dispatchMulti(EventType_UpsertAll, items);
	};

	/**
	 * Handle a single entry being updated.
	 */
	onEntryUpdated = async (item: Types['dbItem'], original: Types['uiItem'], updateIDBLastSynced: boolean = true): Promise<void> => {
		item = (await this.upgradeInstances([item]))[0];
		const event = original._id ? EventType_Update : EventType_Create;
		return this.onEntryUpdatedImpl(event, item, updateIDBLastSynced);
	};

	/**
	 * Handle an entry being patched.
	 */
	protected onEntryPatched = async (item: Types['dbItem'], updateIDBLastSynced: boolean = true): Promise<void> => {
		item = (await this.upgradeInstances([item]))[0];
		return this.onEntryUpdatedImpl(EventType_Patch, item, updateIDBLastSynced);
	};

	/**
	 * Handle unique query result.
	 */
	protected onGotUnique = async (item: Types['dbItem']): Promise<void> => {
		return this.onEntryUpdatedImpl(EventType_Unique, item);
	};

	/**
	 * Handle query results.
	 */
	protected onQueryReturned = async (toUpdate: Types['dbItem'][], toDelete: DB_Object[] = []): Promise<void> => {
		toUpdate = await this.upgradeInstances(toUpdate);
		await this.IDB.syncIndexDb(toUpdate, toDelete);
		this.cache.onEntriesUpdated(toUpdate);
		this.cache.onEntriesDeleted(toDelete as Types['dbItem'][]);
		this.dispatchMulti(EventType_Query, toUpdate);
	};

	private async onEntryUpdatedImpl(event: SingleApiEvent, item: Types['dbItem'], updateIDBLastSynced: boolean = true): Promise<void> {
		await this.IDB.syncIndexDb([item]);
		this.cache.onEntriesUpdated([item]);

		// Set last updated if needed
		const lastUpdated = (item as DB_Object).__updated;
		if ((!this.IDB.getLastSync() && lastUpdated !== 0 || lastUpdated) && updateIDBLastSynced)
			this.IDB.setLastUpdated(lastUpdated);

		this.dispatchSingle(event, item);
	}


	getCollectionName = () => this.config.dbConfig.name;

	getCollectionKey = () => this.config.dbKey;

	/**
	 * Clear all data (IDB and cache).
	 */
	async clearData() {
		await this.IDB.clearAll();
		this.cache.clear();
		this.setDataStatus(DataStatus.NoData);
	}

	/**
	 * Set cache filter for selective caching.
	 */
	protected setCacheFilter = (filter: (item: Readonly<Types['dbItem']>) => boolean) => {
		this.cache.setCacheFilter(filter);
	};
}
