import { FirestoreQuery } from '@nu-art/firebase';
import { ApiDefResolver, BodyApi, QueryApi } from '@nu-art/thunderstorm';
import { DB_BaseObject, DBDef_V3, DBProto, IndexKeys, Metadata } from '@nu-art/ts-common';
import { Response_DBSync, UpgradeCollectionBody } from './api';
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
export type ApiStruct_DBApiGenV3<Proto extends DBProto<any>> = {
    v1: {
        sync: BodyApi<Proto['dbType'][], FirestoreQuery<Proto['dbType']>, undefined>;
        query: BodyApi<Proto['dbType'][], FirestoreQuery<Proto['dbType']>, FirestoreQuery<Proto['dbType']> | undefined | {}>;
        queryUnique: QueryApi<Proto['dbType'], DB_BaseObject, string>;
        upsert: BodyApi<Proto['dbType'], Proto['uiType']>;
        upsertAll: BodyApi<Proto['dbType'][], Proto['uiType'][]>;
        patch: BodyApi<Proto['dbType'], Proto['uiType']>;
        delete: QueryApi<Proto['dbType'], DB_BaseObject>;
        deleteQuery: BodyApi<Proto['dbType'][], FirestoreQuery<Proto['dbType']>>;
        deleteAll: QueryApi<void>;
        upgradeCollection: BodyApi<void, UpgradeCollectionBody>;
        metadata: QueryApi<Metadata<Proto['dbType']>>;
    };
};
export type ApiStruct_DBApiGenIDBV3<Proto extends DBProto<any>> = {
    v1: {
        sync: BodyApi<Response_DBSync<Proto['dbType']>, FirestoreQuery<Proto['dbType']>, undefined>;
        query: BodyApi<Proto['dbType'][], FirestoreQuery<Proto['dbType']>>;
        queryUnique: QueryApi<Proto['dbType'], DB_BaseObject, string | IndexKeys<Proto['dbType'], keyof Proto['dbType']>>;
        upsert: BodyApi<Proto['dbType'], Proto['uiType']>;
        upsertAll: BodyApi<Proto['dbType'][], Proto['uiType'][]>;
        patch: BodyApi<Proto['dbType'], IndexKeys<Proto['dbType'], keyof Proto['dbType']> & Partial<Proto['dbType']>>;
        delete: QueryApi<Proto['dbType'] | undefined, DB_BaseObject>;
        deleteQuery: BodyApi<Proto['dbType'][], FirestoreQuery<Proto['dbType']>>;
        deleteAll: QueryApi<Proto['dbType'][]>;
        upgradeCollection: BodyApi<void, UpgradeCollectionBody>;
        metadata: QueryApi<Metadata<Proto['dbType']>>;
    };
};
export declare const DBApiDefGeneratorV3: <Proto extends DBProto<any>>(dbDef: DBDef_V3<Proto>) => import("@nu-art/thunderstorm").ApiDefRouter<ApiStruct_DBApiGenV3<Proto>>;
export declare const DBApiDefGeneratorIDBV3: <Proto extends DBProto<any>>(dbDef: DBDef_V3<Proto>) => import("@nu-art/thunderstorm").ApiDefRouter<ApiStruct_DBApiGenIDBV3<Proto>>;
