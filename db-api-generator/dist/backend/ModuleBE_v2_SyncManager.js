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
exports.ModuleBE_v2_SyncManager = exports.DBDef_DeletedItems = exports.ModuleBE_v2_SyncManager_Class = void 0;
const backend_1 = require("@nu-art/firebase/backend");
const backend_2 = require("@nu-art/thunderstorm/backend");
const ts_common_1 = require("@nu-art/ts-common");
const shared_1 = require("../shared");
/**
 * # ModuleBE_SyncManager
 *
 * ## <ins>Description:</ins>
 * This module manages all the {@link BaseDB_Module} updates and deleted items in order to allow incremental sync of items with clients
 *
 * ## <ins>Config:</ins>
 *
 * ```json
 * "ModuleBE_SyncManager" : {
 *   	retainDeletedCount: 100
 * }
 * ```
 */
class ModuleBE_v2_SyncManager_Class extends ts_common_1.Module {
    constructor() {
        super();
        this.prepareItemToDelete = (collectionName, item, uniqueKeys = ['_id']) => {
            const { _id, __updated, __created, _v } = item;
            const deletedItem = { __docId: _id, __updated, __created, _v, __collectionName: collectionName };
            uniqueKeys.forEach(key => {
                // @ts-ignore
                deletedItem[key] = item[key] || '';
            });
            return deletedItem;
        };
        this.__onCleanupInvokedV2 = async () => {
            if (!this.config.retainDeletedCount)
                return this.logWarning('Will not run cleanup of deleted values:\n  No "retainDeletedCount" was specified in config..');
            let deletedCount = await this.deletedCount.get();
            if (deletedCount === undefined) {
                deletedCount = (await this.collection.query.custom(shared_1._EmptyQuery)).length;
                await this.deletedCount.set(deletedCount);
            }
            const toDeleteCount = deletedCount - this.config.retainDeletedCount;
            if (toDeleteCount <= 0)
                return;
            this.logDebug('Docs to delete', deletedCount);
            this.logDebug('Docs to retain', this.config.retainDeletedCount);
            const deleted = await this.collection.delete.query({
                limit: toDeleteCount,
                orderBy: [{ key: '__updated', order: 'asc' }]
            });
            let newDeletedCount = deletedCount - deleted.length;
            if (deleted.length !== toDeleteCount) {
                this.logError(`Expected to delete ${toDeleteCount} but actually deleted ${deleted.length}`);
                newDeletedCount = (await this.collection.query.custom(shared_1._EmptyQuery)).length;
            }
            await this.deletedCount.set(newDeletedCount);
            const map = deleted.map(item => item.__collectionName);
            const keys = (0, ts_common_1.filterDuplicates)(map);
            await Promise.all(keys.map(key => {
                const newestDeletedItem = deleted.find(deletedItem => deletedItem.__collectionName === key);
                this.logDebug(`setting oldest deleted timestamp ${key} = ${newestDeletedItem.__updated}`);
                return this.setOldestDeleted(key, newestDeletedItem.__updated);
            }));
        };
        this.fetchDBSyncData = async (_) => {
            const fbSyncData = await this.syncData.get({});
            // @ts-ignore
            const missingModules = this.dbModules.filter(dbModule => !fbSyncData[dbModule.getCollectionName()]);
            if (missingModules.length) {
                // @ts-ignore
                this.logWarning(`Syncing missing modules: `, missingModules.map(module => module.getCollectionName()));
                const query = { limit: 1, orderBy: [{ key: '__updated', order: 'asc' }] };
                // @ts-ignore
                const newestItems = (await Promise.all(missingModules.map(async (missingModule) => {
                    try {
                        return await missingModule.query.custom(query);
                    }
                    catch (e) {
                        return [];
                    }
                })));
                newestItems.forEach((item, index) => { var _a; return fbSyncData[missingModules[index].getCollectionName()] = { lastUpdated: ((_a = item[0]) === null || _a === void 0 ? void 0 : _a.__updated) || 0 }; });
                await this.syncData.set(fbSyncData);
            }
            const syncData = (0, ts_common_1._keys)(fbSyncData).reduce((response, dbName) => {
                response.push(Object.assign({ name: String(dbName) }, fbSyncData[dbName]));
                return response;
            }, []);
            return {
                syncData
            };
        };
        this.setMinLevel(ts_common_1.LogLevel.Debug);
        this.checkSyncApi = (0, backend_2.createQueryServerApi)(shared_1.ApiDef_SyncManagerV2.v1.checkSync, this.fetchDBSyncData);
        this.setDefaultConfig({ retainDeletedCount: 1000 });
    }
    init() {
        const firestore = backend_1.ModuleBE_Firebase.createAdminSession().getFirestoreV2();
        this.collection = firestore.getCollection(exports.DBDef_DeletedItems);
        this.dbModules = this.manager.filterModules(module => (module.ModuleBE_BaseDBV2));
        this.database = backend_1.ModuleBE_Firebase.createAdminSession().getDatabase();
        this.syncData = this.database.ref(`/state/${this.getName()}/syncData`);
        this.deletedCount = this.database.ref(`/state/${this.getName()}/deletedCount`);
        (0, backend_2.addRoutes)([this.checkSyncApi]);
    }
    async onItemsDeleted(collectionName, items, uniqueKeys = ['_id'], transaction) {
        const toInsert = items.map(item => this.prepareItemToDelete(collectionName, item, uniqueKeys));
        const now = (0, ts_common_1.currentTimeMillis)();
        toInsert.forEach(item => item.__updated = now);
        await this.collection.create.all(toInsert, transaction);
        let deletedCount = await this.deletedCount.get(0);
        deletedCount += items.length;
        await this.deletedCount.set(deletedCount);
    }
    async queryDeleted(collectionName, query) {
        const finalQuery = Object.assign(Object.assign({}, query), { where: Object.assign(Object.assign({}, query.where), { __collectionName: collectionName }) });
        const deletedItems = await this.collection.query.custom(finalQuery);
        deletedItems.forEach(_item => _item._id = _item.__docId || _item._id);
        return deletedItems;
    }
    async setLastUpdated(collectionName, lastUpdated) {
        return this.database.patch(`/state/${this.getName()}/syncData/${collectionName}`, { lastUpdated });
    }
    async setOldestDeleted(collectionName, oldestDeleted) {
        return this.database.patch(`/state/${this.getName()}/syncData/${collectionName}`, { oldestDeleted });
    }
}
exports.ModuleBE_v2_SyncManager_Class = ModuleBE_v2_SyncManager_Class;
exports.DBDef_DeletedItems = {
    validator: ts_common_1.tsValidateMustExist,
    dbName: '__deleted__docs',
    entityName: 'DeletedDoc',
    versions: ['1.0.0'],
};
exports.ModuleBE_v2_SyncManager = new ModuleBE_v2_SyncManager_Class();
//# sourceMappingURL=ModuleBE_v2_SyncManager.js.map