import { Response_DBSync } from '../shared';
import { DBConfigV3, IndexDb_Query, IndexedDBV3, OnClearWebsiteData, ReduceFunction, StorageKey, ThunderDispatcher } from '@nu-art/thunderstorm/frontend';
import { DB_Object, DBDef_V3, DBProto, IndexKeys, InvalidResult, Logger, Module, TypedMap, ValidatorTypeResolver } from '@nu-art/ts-common';
import { DataStatus } from './consts';
import { ApiCallerEventTypeV3 } from './v3_types';
import { DBApiFEConfigV3 } from '../v3-db-def';
export declare abstract class ModuleFE_v3_BaseDB<Proto extends DBProto<any>, Config extends DBApiFEConfigV3<Proto> = DBApiFEConfigV3<Proto>> extends Module<Config> implements OnClearWebsiteData {
    readonly validator: ValidatorTypeResolver<any>;
    readonly cache: MemCache<Proto>;
    readonly IDB: IDBCache<Proto>;
    readonly dbDef: DBDef_V3<Proto>;
    private dataStatus;
    readonly defaultDispatcher: ThunderDispatcher<any, string, ApiCallerEventTypeV3<Proto['dbType']>>;
    private readonly ModuleFE_BaseDB;
    protected constructor(dbDef: DBDef_V3<Proto>, defaultDispatcher: ThunderDispatcher<any, string, ApiCallerEventTypeV3<Proto>>);
    protected setDataStatus(status: DataStatus): void;
    protected OnDataStatusChanged(): void;
    getDataStatus(): DataStatus;
    protected init(): void;
    __onClearWebsiteData(resync: boolean): Promise<void>;
    getCollectionName: () => string;
    private dispatchSingle;
    private dispatchMulti;
    onSyncCompleted: (syncData: Response_DBSync<Proto['dbType']>) => Promise<void>;
    onEntriesDeleted: (items: Proto['dbType'][]) => Promise<void>;
    protected onEntryDeleted: (item: Proto['dbType']) => Promise<void>;
    protected onEntriesUpdated: (items: Proto['dbType'][]) => Promise<void>;
    onEntryUpdated: (item: Proto['dbType'], original: Proto['uiType']) => Promise<void>;
    protected onEntryPatched: (item: Proto['dbType']) => Promise<void>;
    validateImpl(instance: Proto['uiType']): void;
    protected onValidationError(instance: Proto['uiType'], results: InvalidResult<Proto['dbType']>): void;
    private onEntryUpdatedImpl;
    protected onGotUnique: (item: Proto['dbType']) => Promise<void>;
    protected onQueryReturned: (toUpdate: Proto['dbType'][], toDelete?: DB_Object[]) => Promise<void>;
}
declare class IDBCache<Proto extends DBProto<any>> extends Logger {
    protected readonly db: IndexedDBV3<Proto>;
    protected readonly lastSync: StorageKey<number>;
    protected readonly lastVersion: StorageKey<string>;
    constructor(dbConfig: DBConfigV3<Proto>, currentVersion: string);
    forEach: (processor: (item: Proto['dbType']) => void) => Promise<Proto["dbType"][]>;
    clear: (resync?: boolean) => Promise<void>;
    delete: (resync?: boolean) => Promise<void>;
    query: (query?: string | number | string[] | number[], indexKey?: string) => Promise<Proto['dbType'][]>;
    /**
     * Iterates over all DB objects in the related collection, and returns all the items that pass the filter
     *
     * @param {function} filter - Boolean returning function, to determine which objects to return.
     * @param {Object} [query] - A query object
     *
     * @return Array of items or empty array
     */
    filter: (filter: (item: Proto['dbType']) => boolean, query?: IndexDb_Query) => Promise<Proto['dbType'][]>;
    /**
     * Iterates over all DB objects in the related collection, and returns the first item that passes the filter
     *
     * @param {function} filter - Boolean returning function, to determine which object to return.
     *
     * @return a single item or undefined
     */
    find: (filter: (item: Proto['dbType']) => boolean) => Promise<Proto['dbType'] | undefined>;
    /**
     * Iterates over all DB objects in the related collection, and returns an array of items based on the mapper.
     *
     * @param {function} mapper - Function that returns data to map for the object
     * @param {function} [filter] - Boolean returning function, to determine which item to map.
     * @param {Object} [query] - A query object
     *
     * @return An array of mapped items
     */
    map: <MapType>(mapper: (item: Proto['dbType']) => MapType, filter?: ((item: Proto['dbType']) => boolean) | undefined, query?: IndexDb_Query) => Promise<MapType[]>;
    /**
     * iterates over all DB objects in the related collection, and reduces them to a single value based on the reducer.
     * @param {function} reducer - Function that determines who to reduce the array.
     * @param {*} initialValue - An initial value for the reducer
     * @param {function} [filter] - Function that determines which DB objects to reduce.
     * @param {Object} [query] - A query Object.
     *
     * @return a single reduced value.
     */
    reduce: <ReturnType_1>(reducer: ReduceFunction<Proto["dbType"], ReturnType_1>, initialValue: ReturnType_1, filter?: ((item: Proto['dbType']) => boolean) | undefined, query?: IndexDb_Query) => Promise<ReturnType_1>;
    unique: (_key?: string | IndexKeys<Proto['dbType'], keyof Proto['dbType']>) => Promise<Proto['dbType'] | undefined>;
    getLastSync(): number;
    syncIndexDb(toUpdate: Proto['dbType'][], toDelete?: DB_Object[]): Promise<void>;
}
declare class MemCache<Proto extends DBProto<any>> {
    private readonly module;
    private readonly keys;
    loaded: boolean;
    _map: Readonly<TypedMap<Readonly<Proto['dbType']>>>;
    _array: Readonly<Readonly<Proto['dbType']>[]>;
    private cacheFilter?;
    constructor(module: ModuleFE_v3_BaseDB<Proto>, keys: (keyof Proto['dbType'])[]);
    forEach: (processor: (item: Readonly<Proto['dbType']>) => void) => void;
    clear: () => void;
    load: (cacheFilter?: ((item: Readonly<Proto['dbType']>) => boolean) | undefined) => Promise<void>;
    unique: (_key?: Proto['uniqueParam']) => Readonly<Proto['dbType']> | undefined;
    all: () => Readonly<Readonly<Proto['dbType']>[]>;
    allMutable: () => Readonly<Proto['dbType']>[];
    filter: (filter: (item: Readonly<Proto['dbType']>, index: number, array: Readonly<Proto['dbType'][]>) => boolean) => Readonly<Proto['dbType']>[];
    find: (filter: (item: Readonly<Proto['dbType']>, index: number, array: Readonly<Proto['dbType'][]>) => boolean) => Readonly<Proto['dbType']> | undefined;
    map: <MapType>(mapper: (item: Readonly<Proto['dbType']>, index: number, array: Readonly<Proto['dbType'][]>) => MapType) => MapType[];
    sort: <MapType>(map?: keyof Proto["dbType"] | (keyof Proto["dbType"])[] | ((item: Readonly<Proto['dbType']>) => any), invert?: boolean) => Readonly<Proto['dbType']>[];
    arrayToMap: (getKey: (item: Readonly<Proto['dbType']>, index: number, map: {
        [k: string]: Readonly<Proto["dbType"]>;
    }) => string | number, map?: {
        [k: string]: Readonly<Proto["dbType"]>;
    }) => {
        [k: string]: Readonly<Proto["dbType"]>;
    };
    private onEntriesDeleted;
    private onEntriesUpdated;
    private setCache;
}
export {};
