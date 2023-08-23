import { DBProto, Module } from '@nu-art/ts-common';
import { ModuleBE_BaseDBV3 } from './ModuleBE_BaseDBV3';
/**
 * A base class used for implementing CRUD operations on a db module collection.
 *
 * By default, it exposes API endpoints for creating, deleting, updating, querying and querying for unique document.
 */
export declare class ModuleBE_BaseApiV3_Class<Proto extends DBProto<any>> extends Module {
    readonly dbModule: ModuleBE_BaseDBV3<Proto>;
    constructor(dbModule: ModuleBE_BaseDBV3<Proto>);
    init(): void;
    private _metadata;
    private _upgradeCollection;
    private _deleteQuery;
}
export declare const createApisForDBModuleV3: <Proto extends DBProto<any>>(dbModule: ModuleBE_BaseDBV3<Proto, import("./ModuleBE_BaseDBV3").DBApiConfigV3<Proto>>) => ModuleBE_BaseApiV3_Class<Proto>;
