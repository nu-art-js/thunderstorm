"use strict";
/*
 * Database API Generator is a utility library for Thunderstorm.
 *
 * Given proper configurations it will dynamically generate APIs to your Firestore
 * collections, will assert uniqueness and restrict deletion... and more
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleFE_BaseApi = void 0;
const shared_1 = require("../shared");
const frontend_1 = require("@nu-art/thunderstorm/frontend");
const ts_common_1 = require("@nu-art/ts-common");
const consts_1 = require("./consts");
const ModuleFE_BaseDB_1 = require("./ModuleFE_BaseDB");
class ModuleFE_BaseApi extends ModuleFE_BaseDB_1.ModuleFE_BaseDB {
    constructor(dbDef, defaultDispatcher) {
        super(dbDef, defaultDispatcher);
        this.operations = {};
        this.cleanUp = (toUpsert) => {
            return toUpsert;
        };
        this.__syncIfNeeded = async (syncData) => {
            const mySyncData = syncData.find(sync => sync.name === this.config.dbConfig.name);
            if (mySyncData && mySyncData.oldestDeleted !== undefined && mySyncData.oldestDeleted > this.IDB.getLastSync()) {
                this.logWarning('DATA WAS TOO OLD, Cleaning Cache', `${mySyncData.oldestDeleted} > ${this.IDB.getLastSync()}`);
                await this.IDB.clear();
                this.cache.clear();
            }
            if (mySyncData && mySyncData.lastUpdated <= this.IDB.getLastSync()) {
                if (!this.cache.loaded)
                    await this.cache.load();
                this.setDataStatus(consts_1.DataStatus.ContainsData);
                return;
            }
            this.setDataStatus(consts_1.DataStatus.UpdatingData);
            await this.v1.sync().executeSync();
        };
        const apiDef = (0, shared_1.DBApiDefGeneratorIDB)(dbDef);
        const _query = (0, frontend_1.apiWithBody)(apiDef.v1.query, (response) => this.onQueryReturned(response));
        const sync = (0, frontend_1.apiWithBody)(apiDef.v1.sync, this.onSyncCompleted);
        const queryUnique = (0, frontend_1.apiWithQuery)(apiDef.v1.queryUnique, this.onGotUnique);
        const upsert = (0, frontend_1.apiWithBody)(apiDef.v1.upsert, this.onEntryUpdated);
        const patch = (0, frontend_1.apiWithBody)(apiDef.v1.patch, this.onEntryPatched);
        // this.dataStatus = this.IDB.getLastSync() !== 0 ? DataStatus.containsData : DataStatus.NoData;
        const _delete = (0, frontend_1.apiWithQuery)(apiDef.v1.delete, this.onEntryDeleted);
        // @ts-ignore
        this.v1 = {
            sync: (additionalQuery = shared_1._EmptyQuery) => {
                const originalSyncQuery = {
                    where: { __updated: { $gt: this.IDB.getLastSync() } },
                    orderBy: [{ key: '__updated', order: 'desc' }],
                };
                const query = (0, ts_common_1.merge)(originalSyncQuery, additionalQuery);
                const syncRequest = sync(query);
                const _execute = syncRequest.execute.bind(syncRequest);
                const _executeSync = syncRequest.executeSync.bind(syncRequest);
                syncRequest.execute = (onSuccess, onError) => {
                    return _execute(onSuccess, onError);
                };
                syncRequest.executeSync = async () => {
                    return _executeSync();
                };
                return syncRequest;
            },
            query: (query) => _query(query || shared_1._EmptyQuery),
            // @ts-ignore
            queryUnique: (uniqueKeys) => {
                return queryUnique(typeof uniqueKeys === 'string' ? { _id: uniqueKeys } : uniqueKeys);
            },
            // @ts-ignore
            upsert: (toUpsert) => {
                toUpsert = this.cleanUp(toUpsert);
                this.validateImpl(toUpsert);
                return this.updatePending(toUpsert, upsert(toUpsert), 'upsert');
            },
            upsertAll: (0, frontend_1.apiWithBody)(apiDef.v1.upsertAll, this.onEntriesUpdated),
            // @ts-ignore
            patch: (toPatch) => {
                return this.updatePending(toPatch, patch(toPatch), 'patch');
            },
            delete: (item) => {
                return this.updatePending(item, _delete(item), 'delete');
            },
            deleteQuery: (0, frontend_1.apiWithBody)(apiDef.v1.deleteQuery, this.onEntriesDeleted),
            deleteAll: (0, frontend_1.apiWithQuery)(apiDef.v1.deleteAll, () => this.v1.sync().executeSync()),
            upgradeCollection: (0, frontend_1.apiWithBody)(apiDef.v1.upgradeCollection, () => this.v1.sync().executeSync())
        };
        const superClear = this.IDB.clear;
        this.IDB.clear = async (reSync = false) => {
            await superClear();
            this.setDataStatus(consts_1.DataStatus.NoData);
            if (reSync)
                this.v1.sync().execute();
        };
    }
    updatePending(item, request, requestType) {
        const id = item._id;
        if (id === undefined)
            return request;
        const _execute = request.execute.bind(request);
        request.execute = (onSuccess, onError) => {
            var _a;
            const operation = this.operations[id];
            if (!operation) {
                this.operations[id] = { running: { request, requestType } };
                // @ts-ignore
                // this.logInfo(`pre-executing operation(${requestType}) for ${id}: ${item.label}`);
                return _execute((r) => {
                    // @ts-ignore
                    // this.logInfo(`executing operation(${requestType}) for ${id}: ${item.label}`);
                    const pending = this.operations[id].pending;
                    delete this.operations[id];
                    if (!pending)
                        return onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess(r);
                    pending.request.execute(pending.onSuccess, pending.onError);
                }, (e) => {
                    delete this.operations[id];
                    onError === null || onError === void 0 ? void 0 : onError(e);
                });
            }
            const runningRequestType = operation.running.requestType;
            const pendingRequestType = (_a = operation.pending) === null || _a === void 0 ? void 0 : _a.requestType;
            if (runningRequestType === 'delete' || pendingRequestType === 'delete') {
                throw new ts_common_1.BadImplementationException(`Item with id: ${id} is marked for deletion`);
            }
            if (runningRequestType === 'upsert' || runningRequestType === 'patch') {
                if (operation.pending) { // @ts-ignore
                    // this.logInfo(`canceling pending operation(${operation.pending.requestType}) for ${id}`);
                }
                // @ts-ignore
                // this.logInfo(`scheduling pending operation(${requestType}) for ${id}: ${item.label}`);
                operation.pending = { request, requestType, onSuccess, onError };
                operation.running.request.setOnCompleted(undefined);
            }
            return request;
        };
        // request.executeSync = async () => {
        // 	const operation = this.operations[id];
        // 	if (!operation) {
        // 		this.operations[id] = {running: {request, requestType}};
        // 		return request.executeSync();
        // 	}
        // };
        return request;
    }
}
exports.ModuleFE_BaseApi = ModuleFE_BaseApi;
//# sourceMappingURL=ModuleFE_BaseApi.js.map