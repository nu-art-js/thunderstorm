/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {
	_keys,
	BadImplementationException,
	deleteKeysObject,
	exists,
	filterDuplicates,
	InvalidResult,
	lastElement,
	Logger,
	tsValidateResult,
	ValidationException,
	voidFunction
} from '@nu-art/ts-common';
import {
	DataStatus,
	DB_Object,
	DBDef_V3,
	DBProto,
	EventDispatcher,
	EventType_Create,
	EventType_Delete,
	EventType_DeleteMulti,
	EventType_Patch,
	EventType_Query,
	EventType_Unique,
	EventType_Update,
	EventType_UpsertAll,
	getModuleFEConfig,
	KeysOfDB_Object,
	MultiApiEvent,
	NoOpDispatcher,
	SingleApiEvent
} from '../to-refactor/index.js';
import {IDBCache} from '../cache/IDBCache.js';
import {MemCache} from '../cache/MemCache.js';
import {DBApiFEConfig} from '../to-refactor/db-types.js';


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
 * @template Proto - Database prototype type
 */
export abstract class BaseDB<Proto extends DBProto<any>>
	extends Logger {

	readonly validator: Proto['modifiablePropsValidator'];
	readonly cache: MemCache<Proto>;
	readonly IDB: IDBCache<Proto>;
	readonly dbDef: DBDef_V3<Proto>;
	readonly config: DBApiFEConfig<Proto>;
	readonly syncType: ModuleSyncType;

	private dataStatus: DataStatus = DataStatus.NoData;
	private dispatcher: EventDispatcher;

	// Version upgrade processors - maps version string to upgrade function
	private versionUpgrades: Record<string, (items: Proto['dbType'][]) => Promise<void>> = {};

	protected constructor(
		dbDef: DBDef_V3<Proto>,
		syncType: ModuleSyncType = ModuleSyncType.APISync,
		dispatcher: EventDispatcher = NoOpDispatcher
	) {
		super(`BaseDB-${dbDef.dbKey}`);
		this.dbDef = dbDef;
		this.syncType = syncType;
		this.dispatcher = dispatcher;

		const config = getModuleFEConfig(dbDef);
		this.config = config;
		this.validator = config.validator;

		// Initialize caches
		this.cache = new MemCache<Proto>(config.dbConfig.uniqueKeys);
		this.IDB = new IDBCache<Proto>(config.dbConfig, config.key);
	}

	/**
	 * Initialize the module. Must be called before use.
	 */
	init() {
		this.IDB.init();
		this.attachOnLastSyncUpdatedListener();
	}

	
	setDispatcher(dispatcher: EventDispatcher) {
		this.dispatcher = dispatcher;
	}

	private dispatchSingle = (event: SingleApiEvent, item: Proto['dbType']) => {
		this.dispatcher.dispatchModule(event, item);
		this.dispatcher.dispatchUI(event, item);
	};

	private dispatchMulti = (event: MultiApiEvent, items: Proto['dbType'][]) => {
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
		this.dispatcher.dispatchAll('update', {} as Proto['dbType']);
	};

	
	async loadCache(cacheFilter?: (item: Readonly<Proto['dbType']>) => boolean) {
		this.logDebug(`Cache is loading`);

		if (cacheFilter)
			this.cache.setCacheFilter(cacheFilter);

		const existingFilter = this.cache.getCacheFilter();
		let allItems: Proto['dbType'][];

		if (existingFilter)
			allItems = await this.IDB.filter(existingFilter);
		else
			allItems = await this.IDB.query();

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
		processor: (items: Proto['dbType'][]) => Promise<void>
	) {
		this.versionUpgrades[version] = processor;
	}

	async upgradeInstances(instances: Proto['dbType'][], force = false): Promise<Proto['dbType'][]> {
		if (!_keys(this.versionUpgrades).length) {
			this.logVerbose(`No registered upgrade processors for module ${this.dbDef.dbKey}`);
			return instances;
		}

		// Ensure all items have a version
		const latestVersion = lastElement(this.config.versions);
		instances.forEach(instance => {
			if (!instance._v)
				instance._v = latestVersion;
		});

		let instancesToSave: Proto['dbType'][] = [];

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

	
	validateImpl(_instance: Partial<Proto['uiType']>) {
		let _generatedProps = this.dbDef.generatedProps;
		if (!_generatedProps) {
			if (typeof this.dbDef.generatedPropsValidator !== 'object')
				throw new BadImplementationException('while using generated props as a function you must provide generated props in db-def explicitly');

			_generatedProps = _keys(this.dbDef.generatedPropsValidator);
		}

		const instance = deleteKeysObject(_instance as Proto['dbType'], [...KeysOfDB_Object, ..._generatedProps]);
		const results = tsValidateResult(instance, this.validator);
		if (results)
			this.onValidationError(instance, results as InvalidResult<Proto['uiType']>);
	}

	protected validateInternal(_instance: Partial<Proto['uiType']>) {
		this.validateImpl(_instance);
	}

	protected onValidationError(instance: Proto['uiType'], results: InvalidResult<Proto['dbType']>) {
		this.logError(`Error validating object:`, instance, 'With Error: ', results);
		throw new ValidationException('Error validating object', instance, results);
	}

	
	/**
	 * Handle multiple entries being deleted.
	 */
	onEntriesDeleted = async (items: Proto['dbType'][]): Promise<void> => {
		await this.IDB.syncIndexDb([], items);
		this.cache.onEntriesDeleted(items);
		this.dispatchMulti(EventType_DeleteMulti, items);
	};

	/**
	 * Handle a single entry being deleted.
	 */
	protected onEntryDeleted = async (item: Proto['dbType']): Promise<void> => {
		await this.IDB.syncIndexDb([], [item]);
		this.cache.onEntriesDeleted([item]);
		this.dispatchSingle(EventType_Delete, item);
	};

	/**
	 * Handle multiple entries being updated.
	 */
	onEntriesUpdated = async (items: Proto['dbType'][], updateIDBLastSynced: boolean = true): Promise<void> => {
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
	onEntryUpdated = async (item: Proto['dbType'], original: Proto['uiType'], updateIDBLastSynced: boolean = true): Promise<void> => {
		item = (await this.upgradeInstances([item]))[0];
		const event = original._id ? EventType_Update : EventType_Create;
		return this.onEntryUpdatedImpl(event, item, updateIDBLastSynced);
	};

	/**
	 * Handle an entry being patched.
	 */
	protected onEntryPatched = async (item: Proto['dbType'], updateIDBLastSynced: boolean = true): Promise<void> => {
		item = (await this.upgradeInstances([item]))[0];
		return this.onEntryUpdatedImpl(EventType_Patch, item, updateIDBLastSynced);
	};

	/**
	 * Handle unique query result.
	 */
	protected onGotUnique = async (item: Proto['dbType']): Promise<void> => {
		return this.onEntryUpdatedImpl(EventType_Unique, item);
	};

	/**
	 * Handle query results.
	 */
	protected onQueryReturned = async (toUpdate: Proto['dbType'][], toDelete: DB_Object[] = []): Promise<void> => {
		toUpdate = await this.upgradeInstances(toUpdate);
		await this.IDB.syncIndexDb(toUpdate, toDelete);
		this.cache.onEntriesUpdated(toUpdate);
		this.cache.onEntriesDeleted(toDelete as Proto['dbType'][]);
		this.dispatchMulti(EventType_Query, toUpdate);
	};

	private async onEntryUpdatedImpl(event: SingleApiEvent, item: Proto['dbType'], updateIDBLastSynced: boolean = true): Promise<void> {
		await this.IDB.syncIndexDb([item]);
		this.cache.onEntriesUpdated([item]);

		// Set last updated if needed
		const lastUpdated = (item as DB_Object).__updated;
		if ((!this.IDB.getLastSync() && lastUpdated !== 0 || lastUpdated) && updateIDBLastSynced)
			this.IDB.setLastUpdated(lastUpdated);

		this.dispatchSingle(event, item);
	}

	
	getCollectionName = () => this.config.dbConfig.name;

	getCollectionKey = () => this.dbDef.dbKey;

	/**
	 * Clear all data (IDB and cache).
	 */
	async clearData() {
		await this.IDB.clear();
		this.cache.clear();
		this.setDataStatus(DataStatus.NoData);
	}

	/**
	 * Set cache filter for selective caching.
	 */
	protected setCacheFilter = (filter: (item: Readonly<Proto['dbType']>) => boolean) => {
		this.cache.setCacheFilter(filter);
	};
}
