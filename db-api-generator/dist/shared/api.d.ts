import { FirestoreQuery } from '@nu-art/firebase';
import { ApiDefResolver, BodyApi, QueryApi, QueryParams } from '@nu-art/thunderstorm';
import { DB_BaseObject, DB_Object, DBDef, IndexKeys, Metadata, PreDB } from '@nu-art/ts-common';
export declare const _EmptyQuery: Readonly<{
    where: {};
}>;
export type UpgradeCollectionBody = {
    forceUpdate?: boolean;
};
/**
 * !! Workaround !!
 *
 * there is a typescript bug... should be able to use
 *
 * upsert: BodyApi<DBType, PreDB<DBType>>,
 * patch: BodyApi<DBType, PreDB<DBType>>
 *
 * but something about the type resolution goes wrong and instead of seeing Type<GenericType>, it resolves to Type> which makes no sense
 */
export type ApiStruct_DBApiGen<DBType extends DB_Object> = {
    v1: {
        sync: BodyApi<DBType[], FirestoreQuery<DBType>, undefined>;
        query: BodyApi<DBType[], FirestoreQuery<DBType>, FirestoreQuery<DBType> | undefined | {}>;
        queryUnique: QueryApi<DBType, DB_BaseObject, string>;
        upsert: BodyApi<DBType, PreDB<DBType>>;
        upsertAll: BodyApi<DBType[], PreDB<DBType>[]>;
        patch: BodyApi<DBType, PreDB<DBType>>;
        delete: QueryApi<DBType, DB_BaseObject>;
        deleteQuery: BodyApi<DBType[], FirestoreQuery<DBType>>;
        deleteAll: QueryApi<void>;
        upgradeCollection: BodyApi<void, UpgradeCollectionBody>;
        metadata: QueryApi<Metadata<DBType>>;
    };
};
export type ApiStruct_DBApiGenIDB<DBType extends DB_Object, Ks extends keyof DBType> = {
    v1: {
        sync: BodyApi<Response_DBSync<DBType>, FirestoreQuery<DBType>, undefined>;
        query: BodyApi<DBType[], FirestoreQuery<DBType>>;
        queryUnique: QueryApi<DBType, QueryParams, string | IndexKeys<DBType, Ks>>;
        upsert: BodyApi<DBType, PreDB<DBType>>;
        upsertAll: BodyApi<DBType[], PreDB<DBType>[]>;
        patch: BodyApi<DBType, IndexKeys<DBType, Ks> & Partial<DBType>>;
        delete: QueryApi<DBType, DB_BaseObject>;
        deleteQuery: BodyApi<DBType[], FirestoreQuery<DBType>>;
        deleteAll: QueryApi<DBType[]>;
        upgradeCollection: BodyApi<void, UpgradeCollectionBody>;
        metadata: QueryApi<Metadata<DBType>>;
    };
};
export declare const DBApiDefGenerator: <DBType extends DB_Object>(dbDef: DBDef<DBType, "_id">) => import("@nu-art/thunderstorm").ApiDefRouter<ApiStruct_DBApiGen<DBType>>;
export declare const DBApiDefGeneratorIDB: <DBType extends DB_Object, Ks extends keyof DBType>(dbDef: DBDef<DBType, Ks>) => import("@nu-art/thunderstorm").ApiDefRouter<ApiStruct_DBApiGenIDB<DBType, Ks>>;
export type DBSyncData = {
    name: string;
    lastUpdated: number;
    oldestDeleted?: number;
};
export type Response_DBSyncData = {
    syncData: DBSyncData[];
};
export type Response_DBSync<DBType extends DB_Object> = {
    toUpdate: DBType[];
    toDelete: DB_Object[];
};
export type ApiStruct_SyncManager = {
    v1: {
        checkSync: QueryApi<Response_DBSyncData, undefined>;
    };
};
export declare const ApiDef_SyncManager: ApiDefResolver<ApiStruct_SyncManager>;
export declare const ApiDef_SyncManagerV2: ApiDefResolver<ApiStruct_SyncManager>;
