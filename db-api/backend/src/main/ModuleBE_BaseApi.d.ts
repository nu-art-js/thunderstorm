import { DBProto, Module } from '@nu-art/ts-common';
import { ModuleBE_BaseDB } from './ModuleBE_BaseDB.js';
/**
 * A base class used for implementing CRUD operations on a db module collection.
 *
 * By default, it exposes API endpoints for creating, deleting, updating, querying and querying for unique document.
 */
export declare class ModuleBE_BaseApi_Class<Proto extends DBProto<any>> extends Module {
    readonly dbModule: ModuleBE_BaseDB<Proto>;
    readonly apiDef: any;
    constructor(dbModule: ModuleBE_BaseDB<Proto, any>, version?: string);
    init(): void;
    private _metadata;
    private _deleteQuery;
}
export declare const createApisForDBModuleV3: <Proto extends DBProto<any>>(dbModule: ModuleBE_BaseDB<Proto>, version?: string) => ModuleBE_BaseApi_Class<Proto>;
