import { Response_DBSync } from '../shared';
import { DBConfig, IndexDb_Query, IndexedDB, OnClearWebsiteData, ReduceFunction, StorageKey, ThunderDispatcher } from '@nu-art/thunderstorm/frontend';
import { DB_Object, DBDef, Default_UniqueKey, IndexKeys, InvalidResult, Logger, Module, PreDB, TypedMap, UniqueParam, ValidatorTypeResolver } from '@nu-art/ts-common';
import { DBApiFEConfig } from '../db-def';
import { DataStatus } from './consts';
import { ApiCallerEventType } from './types';
export declare abstract class ModuleFE_BaseDB<DBType extends DB_Object, Ks extends keyof PreDB<DBType> = Default_UniqueKey, Config extends DBApiFEConfig<DBType, Ks> = DBApiFEConfig<DBType, Ks>> extends Module<Config> implements OnClearWebsiteData {
    readonly validator: ValidatorTypeResolver<DBType>;
    readonly cache: MemCache<DBType, Ks>;
    readonly IDB: IDBCache<DBType, Ks>;
    readonly dbDef: DBDef<DBType, Ks>;
    private dataStatus;
    readonly defaultDispatcher: ThunderDispatcher<any, string, ApiCallerEventType<DBType>>;
    private readonly ModuleFE_BaseDB;
    protected constructor(dbDef: DBDef<DBType, Ks>, defaultDispatcher: ThunderDispatcher<any, string, ApiCallerEventType<DBType>>);
    protected setDataStatus(status: DataStatus): void;
    protected OnDataStatusChanged(): void;
    getDataStatus(): DataStatus;
    protected init(): void;
    __onClearWebsiteData(resync: boolean): Promise<void>;
    getCollectionName: () => string;
    private dispatchSingle;
    private dispatchMulti;
    onSyncCompleted: (syncData: Response_DBSync<DBType>) => Promise<void>;
    onEntriesDeleted: (items: DBType[]) => Promise<void>;
    protected onEntryDeleted: (item: DBType) => Promise<void>;
    protected onEntriesUpdated: (items: DBType[]) => Promise<void>;
    onEntryUpdated: (item: DBType, original: PreDB<DBType>) => Promise<void>;
    protected onEntryPatched: (item: DBType) => Promise<void>;
    validateImpl(instance: PreDB<DBType>): void;
    protected onValidationError(instance: PreDB<DBType>, results: InvalidResult<DBType>): void;
    private onEntryUpdatedImpl;
    protected onGotUnique: (item: DBType) => Promise<void>;
    protected onQueryReturned: (toUpdate: DBType[], toDelete?: DB_Object[]) => Promise<void>;
}
declare class IDBCache<DBType extends DB_Object, Ks extends keyof DBType = '_id'> extends Logger {
    protected readonly db: IndexedDB<DBType, Ks>;
    protected readonly lastSync: StorageKey<number>;
    protected readonly lastVersion: StorageKey<string>;
    constructor(dbConfig: DBConfig<DBType, Ks>, currentVersion: string);
    forEach: (processor: (item: DBType) => void) => Promise<DBType[]>;
    clear: (resync?: boolean) => Promise<void>;
    delete: (resync?: boolean) => Promise<void>;
    query: (query?: string | number | string[] | number[], indexKey?: string) => Promise<DBType[]>;
    /**
     * Iterates over all DB objects in the related collection, and returns all the items that pass the filter
     *
     * @param {function} filter - Boolean returning function, to determine which objects to return.
     * @param {Object} [query] - A query object
     *
     * @return Array of items or empty array
     */
    filter: (filter: (item: DBType) => boolean, query?: IndexDb_Query) => Promise<DBType[]>;
    /**
     * Iterates over all DB objects in the related collection, and returns the first item that passes the filter
     *
     * @param {function} filter - Boolean returning function, to determine which object to return.
     *
     * @return a single item or undefined
     */
    find: (filter: (item: DBType) => boolean) => Promise<DBType | undefined>;
    /**
     * Iterates over all DB objects in the related collection, and returns an array of items based on the mapper.
     *
     * @param {function} mapper - Function that returns data to map for the object
     * @param {function} [filter] - Boolean returning function, to determine which item to map.
     * @param {Object} [query] - A query object
     *
     * @return An array of mapped items
     */
    map: <MapType>(mapper: (item: DBType) => MapType, filter?: ((item: DBType) => boolean) | undefined, query?: IndexDb_Query) => Promise<MapType[]>;
    /**
     * iterates over all DB objects in the related collection, and reduces them to a single value based on the reducer.
     * @param {function} reducer - Function that determines who to reduce the array.
     * @param {*} initialValue - An initial value for the reducer
     * @param {function} [filter] - Function that determines which DB objects to reduce.
     * @param {Object} [query] - A query Object.
     *
     * @return a single reduced value.
     */
    reduce: <ReturnType_1>(reducer: ReduceFunction<DBType, ReturnType_1>, initialValue: ReturnType_1, filter?: ((item: DBType) => boolean) | undefined, query?: IndexDb_Query) => Promise<ReturnType_1>;
    unique: (_key?: string | IndexKeys<DBType, Ks>) => Promise<DBType | undefined>;
    getLastSync(): number;
    syncIndexDb(toUpdate: DBType[], toDelete?: DB_Object[]): Promise<void>;
}
declare class MemCache<DBType extends DB_Object, Ks extends keyof PreDB<DBType> = Default_UniqueKey> {
    private readonly module;
    private readonly keys;
    loaded: boolean;
    _map: Readonly<TypedMap<Readonly<DBType>>>;
    _array: Readonly<Readonly<DBType>[]>;
    private cacheFilter?;
    constructor(module: ModuleFE_BaseDB<DBType, Ks>, keys: Ks[]);
    forEach: (processor: (item: Readonly<DBType>) => void) => void;
    clear: () => void;
    load: (cacheFilter?: ((item: Readonly<DBType>) => boolean) | undefined) => Promise<void>;
    unique: (_key?: UniqueParam<DBType, Ks>) => Readonly<DBType> | undefined;
    all: () => Readonly<Readonly<DBType>[]>;
    allMutable: () => Readonly<DBType>[];
    filter: (filter: (item: Readonly<DBType>, index: number, array: Readonly<DBType[]>) => boolean) => Readonly<DBType>[];
    find: (filter: (item: Readonly<DBType>, index: number, array: Readonly<DBType[]>) => boolean) => Readonly<DBType> | undefined;
    map: <MapType>(mapper: (item: Readonly<DBType>, index: number, array: Readonly<DBType[]>) => MapType) => MapType[];
    sort: <MapType>(map?: keyof DBType | (keyof DBType)[] | ((item: Readonly<DBType>) => any), invert?: boolean) => Readonly<DBType>[];
    arrayToMap: (getKey: (item: Readonly<DBType>, index: number, map: {
        [k: string]: Readonly<DBType>;
    }) => string | number, map?: {
        [k: string]: Readonly<DBType>;
    }) => {
        [k: string]: Readonly<DBType>;
    };
    private onEntriesDeleted;
    private onEntriesUpdated;
    private setCache;
}
export {};
