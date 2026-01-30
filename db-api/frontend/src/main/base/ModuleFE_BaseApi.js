/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ModuleFE_BaseDB, ModuleSyncType } from './ModuleFE_BaseDB.js';
import { ApiCaller, HttpClient } from '@nu-art/http-client';
import { resolveContent } from '@nu-art/ts-common';
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
export class ModuleFE_BaseApi extends ModuleFE_BaseDB {
    crudApiDef;
    httpClient;
    operationsById = new Map();
    constructor(params) {
        super(params.config, ModuleSyncType.APISync, params.dispatcher);
        this.crudApiDef = params.crudApiDef;
        this.httpClient = params.httpClient ?? (() => HttpClient.default);
    }
    /**
     * Run a Promise-returning function serialized per document id.
     * Only one upsert/patch/delete runs at a time per id; further work is queued.
     * Throws if a delete is running or queued for that id.
     */
    runSerializedById(id, requestType, fn) {
        if (id === undefined || id === null || id === '')
            return fn();
        const op = this.operationsById.get(id);
        if (op) {
            if (op.running.requestType === 'delete' || op.pending?.requestType === 'delete')
                throw new Error(`Item with id ${id} is marked for deletion`);
            const p = new Promise((resolve, reject) => {
                const pending = {
                    requestType,
                    fn: fn,
                    resolve: resolve,
                    reject
                };
                if (!op.pending) {
                    op.pending = pending;
                    op.running.promise.finally(() => this.runNext(id));
                }
                else
                    reject(new Error(`Item ${id}: only one pending operation allowed`));
            });
            return p;
        }
        const promise = fn();
        this.operationsById.set(id, { running: { requestType, promise } });
        promise.finally(() => this.runNext(id));
        return promise;
    }
    runNext(id) {
        const op = this.operationsById.get(id);
        if (!op?.pending) {
            this.operationsById.delete(id);
            return;
        }
        const { pending } = op;
        op.pending = undefined;
        const nextPromise = pending.fn().then(pending.resolve, pending.reject);
        op.running = { requestType: pending.requestType, promise: nextPromise };
        nextPromise.finally(() => this.runNext(id));
    }
    /**
     * Clean up data before sending to API.
     * Override to add custom cleanup logic.
     */
    cleanUp(toUpsert) {
        return toUpsert;
    }
    async query(body = {}) {
        void body;
        return undefined;
    }
    async queryUnique(params) {
        void params;
        return undefined;
    }
    async upsert(body) {
        body = this.cleanUp(body);
        this.validateInternal(body);
        return undefined;
    }
    async upsertAll(body) {
        void body;
        return undefined;
    }
    async patch(partial) {
        void partial;
        return undefined;
    }
    async delete(params) {
        void params;
    }
    async deleteQuery(body = {}) {
        void body;
    }
    async deleteAll(_params = {}) {
    }
    /**
     * Standard callback for upsert operations.
     * Updates cache, IDB, and dispatches events.
     */
    handleUpsertComplete = async (ctx) => {
        await this.onEntryUpdated(ctx.response, ctx.body);
        this.IDB.setLastUpdated(ctx.response.__updated);
    };
    /**
     * Standard callback for upsertAll operations.
     */
    handleUpsertAllComplete = async (ctx) => {
        const items = ctx.response;
        await this.onEntriesUpdated(items);
        const lastUpdated = items.reduce((acc, item) => Math.max(acc, item.__updated), -1);
        this.IDB.setLastUpdated(lastUpdated);
    };
    /**
     * Standard callback for patch operations.
     */
    handlePatchComplete = async (ctx) => {
        await this.onEntryPatched(ctx.response);
    };
    /**
     * Standard callback for delete operations.
     */
    handleDeleteComplete = async (ctx) => {
        if (ctx.response)
            await this.onEntryDeleted(ctx.response);
    };
    /**
     * Standard callback for deleteQuery operations.
     */
    handleDeleteQueryComplete = async (ctx) => {
        await this.onEntriesDeleted(ctx.response ?? []);
    };
    /**
     * Standard callback for query operations.
     */
    handleQueryComplete = async (ctx) => {
        await this.onQueryReturned(ctx.response);
    };
    /**
     * Standard callback for queryUnique operations.
     */
    handleQueryUniqueComplete = async (ctx) => {
        await this.onGotUnique(ctx.response);
    };
}
__decorate([
    ApiCaller((m) => m.crudApiDef.query, {
        httpClient: m => resolveContent(m.httpClient),
        onComplete: (m, ctx) => m.handleQueryComplete(ctx)
    })
], ModuleFE_BaseApi.prototype, "query", null);
__decorate([
    ApiCaller((m) => m.crudApiDef.queryUnique, {
        httpClient: m => resolveContent(m.httpClient),
        onComplete: (m, ctx) => m.handleQueryUniqueComplete(ctx)
    })
], ModuleFE_BaseApi.prototype, "queryUnique", null);
__decorate([
    ApiCaller((m) => m.crudApiDef.upsert, {
        httpClient: m => resolveContent(m.httpClient),
        onComplete: (m, ctx) => m.handleUpsertComplete(ctx)
    })
], ModuleFE_BaseApi.prototype, "upsert", null);
__decorate([
    ApiCaller((m) => m.crudApiDef.upsertAll, {
        httpClient: m => resolveContent(m.httpClient),
        onComplete: (m, ctx) => m.handleUpsertAllComplete(ctx)
    })
], ModuleFE_BaseApi.prototype, "upsertAll", null);
__decorate([
    ApiCaller((m) => m.crudApiDef.patch, {
        httpClient: m => resolveContent(m.httpClient),
        onComplete: (m, ctx) => m.handlePatchComplete(ctx)
    })
], ModuleFE_BaseApi.prototype, "patch", null);
__decorate([
    ApiCaller((m) => m.crudApiDef.delete, {
        httpClient: m => resolveContent(m.httpClient),
        onComplete: (m, ctx) => m.handleDeleteComplete(ctx)
    })
], ModuleFE_BaseApi.prototype, "delete", null);
__decorate([
    ApiCaller((m) => m.crudApiDef.deleteQuery, {
        httpClient: m => resolveContent(m.httpClient),
        onComplete: (m, ctx) => m.handleDeleteQueryComplete(ctx)
    })
], ModuleFE_BaseApi.prototype, "deleteQuery", null);
__decorate([
    ApiCaller((m) => m.crudApiDef.deleteAll, {
        httpClient: m => resolveContent(m.httpClient),
    })
], ModuleFE_BaseApi.prototype, "deleteAll", null);
//# sourceMappingURL=ModuleFE_BaseApi.js.map