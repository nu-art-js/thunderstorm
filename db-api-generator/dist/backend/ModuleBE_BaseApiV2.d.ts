import { DB_Object, Default_UniqueKey, Module, PreDB } from '@nu-art/ts-common';
import { DBApiConfig, ModuleBE_BaseDBV2 } from './ModuleBE_BaseDBV2';
/**
 * A base class used for implementing CRUD operations on a db module collection.
 *
 * By default, it exposes API endpoints for creating, deleting, updating, querying and querying for unique document.
 */
export declare class ModuleBE_BaseApiV2_Class<Type extends DB_Object, ConfigType extends DBApiConfig<Type> = DBApiConfig<Type>, Ks extends keyof PreDB<Type> = Default_UniqueKey> extends Module {
    readonly dbModule: ModuleBE_BaseDBV2<Type, any, Ks>;
    constructor(dbModule: ModuleBE_BaseDBV2<Type, any, Ks>);
    init(): void;
    private _metadata;
    private _upgradeCollection;
    private _deleteQuery;
}
export declare const createApisForDBModuleV2: <DBType extends DB_Object, Ks extends "_id" | "_v" | "_originDocId" | "__hardDelete" | "__created" | "__updated" | Exclude<keyof DBType, "_id" | "_v" | "_originDocId" | "__hardDelete" | "__created" | "__updated"> = "_id">(dbModule: ModuleBE_BaseDBV2<DBType, any, Ks>) => ModuleBE_BaseApiV2_Class<DBType, any, Ks>;
