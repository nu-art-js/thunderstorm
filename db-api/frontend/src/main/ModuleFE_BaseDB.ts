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
	ValidationException
} from '@nu-art/ts-common';
import {getDatabase, IDB_Store} from '@nu-art/idb-frontend';
import {
	ApiCallerEventType,
	composeDbObjectUniqueId,
	DB_Object,
	DB_Prototype,
	dbObjectToId,
	EventType_Create,
	EventType_Delete,
	EventType_DeleteMulti,
	EventType_Patch,
	EventType_Query,
	EventType_Unique,
	EventType_Update,
	EventType_UpsertAll,
	KeysOfDB_Object,
	SingleApiEvent
} from '@nu-art/db-api-shared';

import {DBConfig} from '@nu-art/idb-shared';

export type EventDispatcher<DBItem extends DB_Object> = (...params: ApiCallerEventType<DBItem>) => void

/**
 * Data synchronization status for frontend modules.
 */
export enum DataStatus {
	NoData       = 0,
	ContainsData = 1,
	UpdatingData = 2
}


/**
 * Minimal configuration for BaseDB/BaseApi modules.
 *
 * Contains only what the module needs to operate, without Proto dependencies.
 *
 * @template Types - DB_Prototype that define the entity types
 */
export type DBConfig_ModuleFE<Types extends DB_Prototype> = {
	dbKey: Types['dbKey'];
	validator: Types['modifiablePropsValidator'];
	generatedProps?: (keyof Types['dbType'])[];
	uniqueKeys: Types['uniqueKeys'];
	versions: string[];
	dbConfig: DBConfig<Types['dbType']>;
};

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
 * @template Types - DB_Prototype that define the entity types (decoupled from Proto)
 */
export class ModuleFE_BaseDB<Database extends DB_Prototype>
	extends Module {

	readonly validator: Database['modifiablePropsValidator'];
	readonly cache: MemCache<Database['dbType']>;
	readonly config: DBConfig_ModuleFE<Database>;
	readonly IDB: IDB_Store<Database['dbType']>;
	private readonly keysToStripForValidation: (keyof Database['dbType'])[];

	private dataStatus: DataStatus = DataStatus.NoData;
	public readonly dispatcher: EventDispatcher<Database['dbType']>;

	// Version upgrade processors - maps version string to upgrade function
	private versionUpgrades: Record<string, (items: Database['dbType'][]) => Promise<void>> = {};

	protected constructor(config: DBConfig_ModuleFE<Database>, dispatcher: EventDispatcher<Database['dbType']>) {
		super(`BaseDB-${config.dbKey}`);
		this.addToClassStack(ModuleFE_BaseDB);
		this.config = config;
		this.dispatcher = dispatcher;
		this.validator = config.validator;
		this.keysToStripForValidation = config.generatedProps
			? [...KeysOfDB_Object, ...config.generatedProps] as (keyof Database['dbType'])[]
			: KeysOfDB_Object as (keyof Database['dbType'])[];

		// Initialize caches (ts-common MemCache with DB id logic from to-refactor)
		const uniqueKeys = config.uniqueKeys;
		this.cache = new MemCache<Database['dbType']>({
			getId: (item) => dbObjectToId(item),
			keyToId: (key) => typeof key === 'string' ? key : composeDbObjectUniqueId(key as Database['dbType'], uniqueKeys)
		});

		// IDB: one database instance per group so multiple stores share the same DB
		const db = getDatabase(config.dbConfig.group);
		const currentVersion = config.versions[0] ?? '';

		const storeConfig = {
			name: this.config.dbConfig.name,
			uniqueKeys: this.config.uniqueKeys,
			autoIncrement: this.config.dbConfig.autoIncrement
		};

		const store = db.createStore(storeConfig, async (): Promise<void> => {
			const previousVersion = store.getLastVersion();
			const storeExists = await store.exists();
			if (!storeExists)
				return;
			if (storeExists && (!previousVersion || previousVersion === currentVersion))
				return;
			await store.clearAll();
			store.setLastVersion(currentVersion);
		}) as IDB_Store<Database['dbType']>;

		if (config.dbConfig.indices?.length) {
			for (const idx of config.dbConfig.indices) {
				const keys = idx.keys;
				const params = idx.params ? {unique: idx.params.unique, multiEntry: idx.params.multiEntry} : undefined;
				store.createIndex(idx.id, keys as (keyof Database['dbType'])[] | keyof Database['dbType'], params);
			}
		}

		this.IDB = store;
	}

	setDataStatus(status: DataStatus) {
		this.logDebug(`Data status updated: ${DataStatus[this.dataStatus]} => ${DataStatus[status]}`);
		if (this.dataStatus === status)
			return;

		this.dataStatus = status;
	}

	getDataStatus() {
		return this.dataStatus;
	}


	private onLastSyncUpdatedListener = async (after?: number, before?: number) => {
		if (!exists(after) || after === before)
			return;

		this.logVerbose(JSON.stringify({
			event: 'sync.idb-last-updated/changed',
			dbKey: this.config.dbKey,
			before,
			after,
		}));
		await this.loadCache();

		this.dispatcher('update', {} as Database['dbType']);
	};

	/** Structured IDB vs MemCache snapshot for sync troubleshooting (MCP filter: `sync\\.`). */
	logCacheState = async (event: string, extra?: Record<string, unknown>) => {
		const idbItems = await this.IDB.getAll();
		this.logDebug(JSON.stringify({
			event,
			dbKey: this.config.dbKey,
			idbCount: idbItems.length,
			cacheCount: this.cache.all().length,
			dataStatus: DataStatus[this.getDataStatus()],
			idbLastSync: this.IDB.getLastSync(),
			...extra,
		}));
	};

	async openIDB() {
		await this.IDB.open();
		this.IDB.onLastUpdateListener(this.onLastSyncUpdatedListener);
	}

	async loadCache(cacheFilter?: (item: Readonly<Database['dbType']>) => boolean) {
		this.logDebug(`Cache is loading`);

		if (cacheFilter)
			this.cache.setCacheFilter(cacheFilter);

		const existingFilter = this.cache.getCacheFilter();
		let allItems: Database['dbType'][];

		if (existingFilter)
			allItems = await this.IDB.filter(existingFilter);
		else
			allItems = await this.IDB.getAll();

		// Upgrade items
		await this.upgradeInstances(allItems);

		this.cache.load(allItems);
		this.logDebug(`Cache finished loading, count: ${this.cache.all().length}`);
		await this.logCacheState('sync.load-cache/completed', {loadedFromIdbCount: allItems.length});
	}


	/**
	 * Register a version upgrade processor.
	 *
	 * @param version - The version string to upgrade from
	 * @param processor - Function to transform items from this version
	 */
	registerVersionUpgradeProcessor(
		version: string,
		processor: (items: Database['dbType'][]) => Promise<void>
	) {
		this.versionUpgrades[version] = processor;
	}

	async upgradeInstances(instances: Database['dbType'][], force = false): Promise<Database['dbType'][]> {
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

		let instancesToSave: Database['dbType'][] = [];

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
			instancesToUpgrade.forEach(instance => (instance._v = nextVersion));
		}

		return force ? instances : instancesToSave;
	}


	validateImpl(_instance: Partial<Database['uiType']>) {
		const instance = deleteKeysObject(_instance as Database['dbType'], this.keysToStripForValidation);
		const results = tsValidateResult(instance, this.validator, undefined, false);
		if (results)
			this.onValidationError(_instance as Database['uiType'], results as InvalidResult<Database['dbType']>);
	}

	protected validateInternal(_instance: Partial<Database['uiType']>) {
		this.validateImpl(_instance);
	}

	protected onValidationError(instance: Database['uiType'], results: InvalidResult<Database['uiType']>) {
		this.logError(`Error validating object:`, instance, 'With Error: ', results);
		throw new ValidationException('Error validating object', instance, results);
	}


	/**
	 * Handle multiple entries being deleted.
	 */
	onEntriesDeleted = async (items: Database['dbType'][]): Promise<void> => {
		await this.IDB.syncIndexDb([], items);
		this.cache.onEntriesDeleted(items);
		this.dispatcher(EventType_DeleteMulti, items);
	};

	/**
	 * Handle a single entry being deleted.
	 */
	protected onEntryDeleted = async (item: Database['dbType']): Promise<void> => {
		await this.IDB.syncIndexDb([], [item]);
		this.cache.onEntriesDeleted([item]);
		this.dispatcher(EventType_Delete, item);
	};

	/**
	 * Handle multiple entries being updated.
	 */
	onEntriesUpdated = async (items: Database['dbType'][], updateIDBLastSynced: boolean = true): Promise<void> => {
		items = await this.upgradeInstances(items);
		await this.IDB.syncIndexDb(items);
		this.cache.onEntriesUpdated(items);

		// Update the collection last updated timestamp
		const lastUpdated = items.reduce((toRet, current) => Math.max(toRet, current.__updated), 0);
		if ((!this.IDB.getLastSync() && lastUpdated !== 0 || lastUpdated) && updateIDBLastSynced)
			this.IDB.setLastUpdated(lastUpdated);

		this.dispatcher(EventType_UpsertAll, items);
	};

	/**
	 * Handle a single entry being updated.
	 */
	onEntryUpdated = async (item: Database['dbType'], original: Database['uiType'], updateIDBLastSynced: boolean = true): Promise<void> => {
		item = (await this.upgradeInstances([item]))[0];
		const event = original._id ? EventType_Update : EventType_Create;
		return this.onEntryUpdatedImpl(event, item, updateIDBLastSynced);
	};

	/**
	 * Handle an entry being patched.
	 */
	protected onEntryPatched = async (item: Database['dbType'], updateIDBLastSynced: boolean = true): Promise<void> => {
		item = (await this.upgradeInstances([item]))[0];
		return this.onEntryUpdatedImpl(EventType_Patch, item, updateIDBLastSynced);
	};

	/**
	 * Handle unique query result.
	 */
	protected onGotUnique = async (item: Database['dbType']): Promise<void> => {
		return this.onEntryUpdatedImpl(EventType_Unique, item);
	};

	/**
	 * Handle query results.
	 */
	protected onQueryReturned = async (toUpdate: Database['dbType'][], toDelete: Database['dbType'][] = []): Promise<void> => {
		toUpdate = await this.upgradeInstances(toUpdate);
		await this.IDB.syncIndexDb(toUpdate, toDelete);
		this.cache.onEntriesUpdated(toUpdate);
		this.cache.onEntriesDeleted(toDelete);
		this.dispatcher(EventType_Query, toUpdate);
	};

	/**
	 * Apply a batch of items to update and delete (IDB, cache, dispatch). Updates last-sync from max __updated in toUpdate when present.
	 */
	applyBatch = async (toUpdate: Database['dbType'][], toDelete: Database['dbType'][] = []): Promise<void> => {
		await this.onQueryReturned(toUpdate, toDelete);
		const lastUpdated = toUpdate.length ? toUpdate.reduce((acc, item) => Math.max(acc, item.__updated ?? 0), 0) : 0;
		if (lastUpdated && (!this.IDB.getLastSync() || lastUpdated > this.IDB.getLastSync()))
			this.IDB.setLastUpdated(lastUpdated);
	};

	private async onEntryUpdatedImpl(event: SingleApiEvent, item: Database['dbType'], updateIDBLastSynced: boolean = true): Promise<void> {
		await this.IDB.syncIndexDb([item]);
		this.cache.onEntriesUpdated([item]);

		// Set last updated if needed
		const lastUpdated = item.__updated;
		if ((!this.IDB.getLastSync() && lastUpdated !== 0 || lastUpdated) && updateIDBLastSynced)
			this.IDB.setLastUpdated(lastUpdated);

		this.dispatcher(event, item);
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
	protected setCacheFilter = (filter: (item: Readonly<Database['dbType']>) => boolean) => {
		this.cache.setCacheFilter(filter);
	};
}
