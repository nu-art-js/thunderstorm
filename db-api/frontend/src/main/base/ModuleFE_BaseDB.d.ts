import { InvalidResult, MemCache, Module } from '@nu-art/ts-common';
import { IDB_Store } from '@nu-art/idb-frontend';
import { DataStatus } from '../to-refactor/consts.js';
import { DB_Object } from '../to-refactor/db-types.js';
import { EventDispatcher } from '../to-refactor/dispatcher.js';
import { BaseDBConfig, ModuleTypes } from './types.js';
/**
 * Sync type for frontend modules.
 */
export declare enum ModuleSyncType {
    NoSync = 0,
    CSVSync = 1,
    APISync = 2
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
export declare class ModuleFE_BaseDB<Types extends ModuleTypes> extends Module {
    readonly validator: Types['validator'];
    readonly cache: MemCache<Types['dbItem']>;
    readonly config: BaseDBConfig<Types>;
    readonly syncType: ModuleSyncType;
    readonly IDB: IDB_Store<Types['dbItem']>;
    private dataStatus;
    private dispatcher;
    private versionUpgrades;
    protected constructor(config: BaseDBConfig<Types>, syncType?: ModuleSyncType, dispatcher?: EventDispatcher);
    /**
     * Initialize the module. Must be called before use.
     */
    init(): Promise<void>;
    setDispatcher(dispatcher: EventDispatcher): void;
    private dispatchSingle;
    private dispatchMulti;
    setDataStatus(status: DataStatus): void;
    getDataStatus(): DataStatus;
    attachOnLastSyncUpdatedListener: () => void;
    detachOnLastSyncUpdatedListener: () => void;
    private onLastSyncUpdatedListener;
    loadCache(cacheFilter?: (item: Readonly<Types['dbItem']>) => boolean): Promise<void>;
    /**
     * Register a version upgrade processor.
     *
     * @param version - The version string to upgrade from
     * @param processor - Function to transform items from this version
     */
    registerVersionUpgradeProcessor(version: string, processor: (items: Types['dbItem'][]) => Promise<void>): void;
    upgradeInstances(instances: Types['dbItem'][], force?: boolean): Promise<Types['dbItem'][]>;
    validateImpl(_instance: Partial<Types['uiItem']>): void;
    protected validateInternal(_instance: Partial<Types['uiItem']>): void;
    protected onValidationError(instance: Types['uiItem'], results: InvalidResult<Types['uiItem']>): void;
    /**
     * Handle multiple entries being deleted.
     */
    onEntriesDeleted: (items: Types["dbItem"][]) => Promise<void>;
    /**
     * Handle a single entry being deleted.
     */
    protected onEntryDeleted: (item: Types["dbItem"]) => Promise<void>;
    /**
     * Handle multiple entries being updated.
     */
    onEntriesUpdated: (items: Types["dbItem"][], updateIDBLastSynced?: boolean) => Promise<void>;
    /**
     * Handle a single entry being updated.
     */
    onEntryUpdated: (item: Types["dbItem"], original: Types["uiItem"], updateIDBLastSynced?: boolean) => Promise<void>;
    /**
     * Handle an entry being patched.
     */
    protected onEntryPatched: (item: Types["dbItem"], updateIDBLastSynced?: boolean) => Promise<void>;
    /**
     * Handle unique query result.
     */
    protected onGotUnique: (item: Types["dbItem"]) => Promise<void>;
    /**
     * Handle query results.
     */
    protected onQueryReturned: (toUpdate: Types["dbItem"][], toDelete?: DB_Object[]) => Promise<void>;
    private onEntryUpdatedImpl;
    getCollectionName: () => string;
    getCollectionKey: () => Types["dbKey"];
    /**
     * Clear all data (IDB and cache).
     */
    clearData(): Promise<void>;
    /**
     * Set cache filter for selective caching.
     */
    protected setCacheFilter: (filter: (item: Readonly<Types["dbItem"]>) => boolean) => void;
}
