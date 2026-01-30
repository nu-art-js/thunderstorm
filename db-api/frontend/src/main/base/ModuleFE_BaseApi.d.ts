import { ModuleFE_BaseDB } from './ModuleFE_BaseDB.js';
import { ApiCallContext, HttpClient } from '@nu-art/http-client';
import { CrudApiDefShape } from '../decorators/types.js';
import { BaseDBConfig, ModuleTypes } from './types.js';
import { EventDispatcher } from '../to-refactor/dispatcher.js';
import { ResolvableContent } from '@nu-art/ts-common';
type RequestType = 'upsert' | 'patch' | 'delete';
interface Params<Types extends ModuleTypes> {
    config: BaseDBConfig<Types>;
    crudApiDef: CrudApiDefShape;
    dispatcher?: EventDispatcher;
    httpClient?: HttpClient;
}
/**
 * Base API module for frontend database operations.
 *
 * CRUD methods (query, queryUnique, upsert, upsertAll, patch, delete, deleteQuery, deleteAll)
 * are declared and implemented in the base, using @ApiCaller with lazy
 * getters over readonly crudApiDef. Pass your ApiDef (e.g. MyApiDef.v1) into the constructor;
 * the base stores it as readonly crudApiDef.
 *
 * @template Types - ModuleTypes that define the entity types (decoupled from Proto)
 *
 * @example
 * ```typescript
 * class UserModule extends ModuleFE_BaseApi<UserModuleTypes> {
 *   constructor(config: BaseDBConfig<UserModuleTypes>) {
 *     super(config, UserApiDef.v1);
 *   }
 * }
 * await UserModule.query({});
 * await UserModule.upsert(uiUser);
 * ```
 */
export declare abstract class ModuleFE_BaseApi<Types extends ModuleTypes> extends ModuleFE_BaseDB<Types> {
    readonly crudApiDef: CrudApiDefShape;
    readonly httpClient: ResolvableContent<HttpClient>;
    private operationsById;
    protected constructor(params: Params<Types>);
    /**
     * Run a Promise-returning function serialized per document id.
     * Only one upsert/patch/delete runs at a time per id; further work is queued.
     * Throws if a delete is running or queued for that id.
     */
    protected runSerializedById<T>(id: string | undefined, requestType: RequestType, fn: () => Promise<T>): Promise<T>;
    private runNext;
    /**
     * Clean up data before sending to API.
     * Override to add custom cleanup logic.
     */
    protected cleanUp(toUpsert: Types['uiItem']): Types['uiItem'];
    query(body?: Record<string, unknown>): Promise<Types['dbItem'][]>;
    queryUnique(params: Record<string, unknown>): Promise<Types['dbItem'] | undefined>;
    upsert(body: Types['uiItem']): Promise<Types['dbItem']>;
    upsertAll(body: Types['uiItem'][]): Promise<Types['dbItem'][]>;
    patch(partial: Partial<Types['uiItem']> & {
        _id: string;
    }): Promise<Types['dbItem']>;
    delete(params: Record<string, unknown>): Promise<void>;
    deleteQuery(body?: Record<string, unknown>): Promise<void>;
    deleteAll(_params?: Record<string, unknown>): Promise<void>;
    /**
     * Standard callback for upsert operations.
     * Updates cache, IDB, and dispatches events.
     */
    protected handleUpsertComplete: (ctx: ApiCallContext<any>) => Promise<void>;
    /**
     * Standard callback for upsertAll operations.
     */
    protected handleUpsertAllComplete: (ctx: ApiCallContext<any>) => Promise<void>;
    /**
     * Standard callback for patch operations.
     */
    protected handlePatchComplete: (ctx: ApiCallContext<any>) => Promise<void>;
    /**
     * Standard callback for delete operations.
     */
    protected handleDeleteComplete: (ctx: ApiCallContext<any>) => Promise<void>;
    /**
     * Standard callback for deleteQuery operations.
     */
    protected handleDeleteQueryComplete: (ctx: ApiCallContext<any>) => Promise<void>;
    /**
     * Standard callback for query operations.
     */
    protected handleQueryComplete: (ctx: ApiCallContext<any>) => Promise<void>;
    /**
     * Standard callback for queryUnique operations.
     */
    protected handleQueryUniqueComplete: (ctx: ApiCallContext<any>) => Promise<void>;
}
export {};
