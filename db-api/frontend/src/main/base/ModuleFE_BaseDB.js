/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */
import { _keys, deleteKeysObject, exists, filterDuplicates, lastElement, MemCache, Module, tsValidateResult, ValidationException, voidFunction } from '@nu-art/ts-common';
import { getDatabase } from '@nu-art/idb-frontend';
import { DataStatus, EventType_Create, EventType_Delete, EventType_DeleteMulti, EventType_Patch, EventType_Query, EventType_Unique, EventType_Update, EventType_UpsertAll } from '../to-refactor/consts.js';
import { KeysOfDB_Object } from '../to-refactor/db-types.js';
import { NoOpDispatcher } from '../to-refactor/dispatcher.js';
import { composeDbObjectUniqueId, dbObjectToId } from '../to-refactor/utils.js';
/**
 * Converts DBConfig (db-api shape) to StoreConfig (idb-frontend shape).
 */
function dbConfigToStoreConfig(dbConfig) {
    return {
        name: dbConfig.name,
        uniqueKeys: dbConfig.uniqueKeys,
        autoIncrement: dbConfig.autoIncrement
    };
}
/**
 * Sync type for frontend modules.
 */
export var ModuleSyncType;
(function (ModuleSyncType) {
    ModuleSyncType[ModuleSyncType["NoSync"] = 0] = "NoSync";
    ModuleSyncType[ModuleSyncType["CSVSync"] = 1] = "CSVSync";
    ModuleSyncType[ModuleSyncType["APISync"] = 2] = "APISync";
})(ModuleSyncType || (ModuleSyncType = {}));
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
export class ModuleFE_BaseDB extends Module {
    validator;
    cache;
    config;
    syncType;
    IDB;
    dataStatus = DataStatus.NoData;
    dispatcher;
    // Version upgrade processors - maps version string to upgrade function
    versionUpgrades = {};
    constructor(config, syncType = ModuleSyncType.APISync, dispatcher = NoOpDispatcher) {
        super(`BaseDB-${config.dbKey}`);
        this.config = config;
        this.syncType = syncType;
        this.dispatcher = dispatcher;
        this.validator = config.validator;
        // Initialize caches (ts-common MemCache with DB id logic from to-refactor)
        const uniqueKeys = config.uniqueKeys;
        this.cache = new MemCache({
            getId: (item) => dbObjectToId(item),
            keyToId: (key) => typeof key === 'string' ? key : composeDbObjectUniqueId(key, uniqueKeys)
        });
        // IDB: one database instance per group so multiple stores share the same DB
        const db = getDatabase(config.dbConfig.group);
        const storeConfig = dbConfigToStoreConfig(config.dbConfig);
        const currentVersion = config.versions[0] ?? '';
        const store = db.createStore(storeConfig, async () => {
            const previousVersion = store.getLastVersion();
            const storeExists = await store.exists();
            if (!storeExists)
                return;
            if (storeExists && (!previousVersion || previousVersion === currentVersion))
                return;
            await store.clearAll();
            store.setLastVersion(currentVersion);
        });
        if (config.dbConfig.indices?.length) {
            for (const idx of config.dbConfig.indices) {
                const keys = idx.keys;
                const params = idx.params ? { unique: idx.params.unique, multiEntry: idx.params.multiEntry } : undefined;
                store.createIndex(idx.id, keys, params);
            }
        }
        this.IDB = store;
    }
    /**
     * Initialize the module. Must be called before use.
     */
    async init() {
        await this.IDB.open();
        this.attachOnLastSyncUpdatedListener();
    }
    setDispatcher(dispatcher) {
        this.dispatcher = dispatcher;
    }
    dispatchSingle = (event, item) => {
        this.dispatcher.dispatchModule(event, item);
        this.dispatcher.dispatchUI(event, item);
    };
    dispatchMulti = (event, items) => {
        this.dispatcher.dispatchModule(event, items);
        this.dispatcher.dispatchUI(event, items);
    };
    setDataStatus(status) {
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
    onLastSyncUpdatedListener = async (after, before) => {
        if (!exists(after) || after === before)
            return;
        await this.loadCache();
        this.dispatcher.dispatchAll('update', {});
    };
    async loadCache(cacheFilter) {
        this.logDebug(`Cache is loading`);
        if (cacheFilter)
            this.cache.setCacheFilter(cacheFilter);
        const existingFilter = this.cache.getCacheFilter();
        let allItems;
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
    registerVersionUpgradeProcessor(version, processor) {
        this.versionUpgrades[version] = processor;
    }
    async upgradeInstances(instances, force = false) {
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
        let instancesToSave = [];
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
            }
            else {
                this.logVerbose(`Upgrade instances(${instancesToUpgrade.length}): ${versionTransition}`);
                await upgradeProcessor(instancesToUpgrade);
                instancesToSave.push(...instancesToUpgrade);
            }
            instancesToSave = filterDuplicates(instancesToSave);
            instancesToUpgrade.forEach(instance => instance._v = nextVersion);
        }
        return force ? instances : instancesToSave;
    }
    validateImpl(_instance) {
        // UIItem is well-defined at app level and already excludes generated props
        // Just remove DB_Object keys before validation
        const instance = deleteKeysObject(_instance, KeysOfDB_Object);
        const results = tsValidateResult(instance, this.validator);
        if (results)
            this.onValidationError(_instance, results);
    }
    validateInternal(_instance) {
        this.validateImpl(_instance);
    }
    onValidationError(instance, results) {
        this.logError(`Error validating object:`, instance, 'With Error: ', results);
        throw new ValidationException('Error validating object', instance, results);
    }
    /**
     * Handle multiple entries being deleted.
     */
    onEntriesDeleted = async (items) => {
        await this.IDB.syncIndexDb([], items);
        this.cache.onEntriesDeleted(items);
        this.dispatchMulti(EventType_DeleteMulti, items);
    };
    /**
     * Handle a single entry being deleted.
     */
    onEntryDeleted = async (item) => {
        await this.IDB.syncIndexDb([], [item]);
        this.cache.onEntriesDeleted([item]);
        this.dispatchSingle(EventType_Delete, item);
    };
    /**
     * Handle multiple entries being updated.
     */
    onEntriesUpdated = async (items, updateIDBLastSynced = true) => {
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
    onEntryUpdated = async (item, original, updateIDBLastSynced = true) => {
        item = (await this.upgradeInstances([item]))[0];
        const event = original._id ? EventType_Update : EventType_Create;
        return this.onEntryUpdatedImpl(event, item, updateIDBLastSynced);
    };
    /**
     * Handle an entry being patched.
     */
    onEntryPatched = async (item, updateIDBLastSynced = true) => {
        item = (await this.upgradeInstances([item]))[0];
        return this.onEntryUpdatedImpl(EventType_Patch, item, updateIDBLastSynced);
    };
    /**
     * Handle unique query result.
     */
    onGotUnique = async (item) => {
        return this.onEntryUpdatedImpl(EventType_Unique, item);
    };
    /**
     * Handle query results.
     */
    onQueryReturned = async (toUpdate, toDelete = []) => {
        toUpdate = await this.upgradeInstances(toUpdate);
        await this.IDB.syncIndexDb(toUpdate, toDelete);
        this.cache.onEntriesUpdated(toUpdate);
        this.cache.onEntriesDeleted(toDelete);
        this.dispatchMulti(EventType_Query, toUpdate);
    };
    async onEntryUpdatedImpl(event, item, updateIDBLastSynced = true) {
        await this.IDB.syncIndexDb([item]);
        this.cache.onEntriesUpdated([item]);
        // Set last updated if needed
        const lastUpdated = item.__updated;
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
    setCacheFilter = (filter) => {
        this.cache.setCacheFilter(filter);
    };
}
//# sourceMappingURL=ModuleFE_BaseDB.js.map