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
exports.ModuleBE_BaseDBV2 = void 0;
const ts_common_1 = require("@nu-art/ts-common");
const backend_1 = require("@nu-art/firebase/backend");
const db_def_1 = require("./db-def");
const shared_1 = require("../shared");
const consts_1 = require("@nu-art/firebase/backend/firestore-v2/consts");
const ModuleBE_v2_SyncManager_1 = require("./ModuleBE_v2_SyncManager");
/**
 * An abstract base class used for implementing CRUD operations on a specific collection.
 *
 * By default, it exposes API endpoints for creating, deleting, updating, querying and querying for unique document.
 */
class ModuleBE_BaseDBV2 extends ts_common_1.Module {
    constructor(dbDef, appConfig) {
        super();
        // @ts-ignore
        this.ModuleBE_BaseDBV2 = true;
        this.querySync = async (syncQuery) => {
            const items = await this.collection.query.custom(syncQuery);
            const deletedItems = await ModuleBE_v2_SyncManager_1.ModuleBE_v2_SyncManager.queryDeleted(this.config.collectionName, syncQuery);
            await this.upgradeInstances(items);
            return { toUpdate: items, toDelete: deletedItems };
        };
        this._preWriteProcessing = async (dbItem, transaction) => {
            await this.upgradeInstances([dbItem]);
            await this.preWriteProcessing(dbItem, transaction);
        };
        this._postWriteProcessing = async (data) => {
            const now = (0, ts_common_1.currentTimeMillis)();
            if (data.updated && !(Array.isArray(data.updated) && data.updated.length === 0)) {
                const latestUpdated = Array.isArray(data.updated) ?
                    data.updated.reduce((toRet, current) => Math.max(toRet, current.__updated), data.updated[0].__updated) :
                    data.updated.__updated;
                await ModuleBE_v2_SyncManager_1.ModuleBE_v2_SyncManager.setLastUpdated(this.config.collectionName, latestUpdated);
            }
            if (data.deleted && !(Array.isArray(data.updated) && data.updated.length === 0)) {
                await ModuleBE_v2_SyncManager_1.ModuleBE_v2_SyncManager.onItemsDeleted(this.config.collectionName, (0, ts_common_1.asArray)(data.deleted), this.config.uniqueKeys);
                await ModuleBE_v2_SyncManager_1.ModuleBE_v2_SyncManager.setLastUpdated(this.config.collectionName, now);
            }
            else if (data.deleted === null)
                // this means the whole collection has been deleted - setting the oldestDeleted to now will trigger a clean sync
                await ModuleBE_v2_SyncManager_1.ModuleBE_v2_SyncManager.setOldestDeleted(this.config.collectionName, now);
            await this.postWriteProcessing(data);
        };
        this.upgradeInstances = async (dbInstances) => {
            await Promise.all(dbInstances.map(async (dbInstance) => {
                var _a;
                const instanceVersion = (_a = dbInstance._v) !== null && _a !== void 0 ? _a : (dbInstance._v = ts_common_1.DefaultDBVersion);
                const currentVersion = this.config.versions[0];
                if (instanceVersion !== undefined && instanceVersion !== currentVersion)
                    try {
                        await this.upgradeItem(dbInstance, currentVersion);
                    }
                    catch (e) {
                        this.logError(e);
                        throw new ts_common_1.ApiException(500, `Error while upgrading db item "${this.config.itemName}"(${dbInstance._id}): ${instanceVersion} => ${currentVersion}`, e);
                    }
                dbInstance._v = currentVersion;
            }));
        };
        const config = (0, db_def_1.getModuleBEConfig)(dbDef);
        const preConfig = Object.assign(Object.assign({}, config), appConfig);
        // @ts-ignore
        this.setDefaultConfig(preConfig);
        this.dbDef = dbDef;
        this.canDeleteItems.bind(this);
        this._preWriteProcessing.bind(this);
        this._postWriteProcessing.bind(this);
        this.manipulateQuery.bind(this);
        this.collectDependencies.bind(this);
    }
    /**
     * Executed during the initialization of the module.
     * The collection reference is set in this method.
     */
    init() {
        var _a;
        const firestore = backend_1.ModuleBE_Firebase.createAdminSession((_a = this.config) === null || _a === void 0 ? void 0 : _a.projectId).getFirestoreV2();
        this.collection = firestore.getCollection(this.dbDef, {
            canDeleteItems: this.canDeleteItems.bind(this),
            preWriteProcessing: this._preWriteProcessing.bind(this),
            postWriteProcessing: this._postWriteProcessing.bind(this),
            manipulateQuery: this.manipulateQuery.bind(this)
        });
        // ############################## API ##############################
        this.runTransaction = this.collection.runTransaction;
        const wrapInTryCatch = (input, path) => (0, ts_common_1._keys)(input).reduce((acc, key) => {
            const value = input[key];
            const newPath = path ? `${path}.${String(key)}` : String(key);
            if (typeof value === 'function') {
                acc[key] = (async (...args) => {
                    try {
                        return await value(...args);
                    }
                    catch (e) {
                        this.logError(`Error while calling "${newPath}"`);
                        this.logError(e);
                        throw e;
                    }
                });
                return acc;
            }
            if (typeof value === 'object' && value !== null) {
                acc[key] = wrapInTryCatch(value, newPath);
                return acc;
            }
            acc[key] = value;
            return acc;
        }, {});
        this.query = wrapInTryCatch(this.collection.query, 'query');
        this.create = wrapInTryCatch(this.collection.create, 'create');
        this.set = wrapInTryCatch(this.collection.set, 'set');
        this.delete = wrapInTryCatch(this.collection.delete, 'delete');
        this.doc = wrapInTryCatch(this.collection.doc, 'doc');
    }
    getCollectionName() {
        return this.config.collectionName;
    }
    getItemName() {
        return this.config.itemName;
    }
    __onFirestoreBackupSchedulerActV2() {
        return [{
                query: this.resolveBackupQuery(),
                queryFunction: this.collection.query.custom,
                moduleKey: this.config.collectionName,
                version: this.config.versions[0]
            }];
    }
    resolveBackupQuery() {
        return shared_1._EmptyQuery;
    }
    /**
     * Override this method to customize the processing that should be done before create, set or update.
     *
     * @param transaction - The transaction object.
     * @param dbInstance - The DB entry for which the uniqueness is being asserted.
     * @param request
     */
    async preWriteProcessing(dbInstance, transaction) {
    }
    /**
     * Override this method to customize processing that should be done after create, set, update or delete.
     * @param data: a map of updated and deleted dbItems - deleted === null means the whole collection has been deleted
     */
    async postWriteProcessing(data) {
    }
    manipulateQuery(query) {
        return query;
    }
    async upgradeItem(dbItem, toVersion) {
    }
    async promoteCollection() {
        var _a, _b;
        // read chunks of ${maxChunkSize} documents that are not of the latest collection version..
        // run them via upsert, which should convert/upgrade them to the latest version
        // if timeout should kick in.. run the api again and this will continue the promotion on the rest of the documents
        // TODO validate
        this.logDebug(`Promoting '${this.config.collectionName}' to version: ${this.config.versions[0]}`);
        let page = 0;
        const itemsCount = this.config.maxChunkSize || 100;
        let iteration = 0;
        while (iteration < 5) {
            try {
                const itemsToSyncQuery = {
                    where: {
                        _v: { $neq: this.config.versions[0] },
                    },
                    limit: { page, itemsCount }
                };
                const items = await this.collection.query.custom(itemsToSyncQuery);
                this.logInfo(`Page: ${page} Found: ${items.length} - first: ${(_a = items === null || items === void 0 ? void 0 : items[0]) === null || _a === void 0 ? void 0 : _a.__updated}   last: ${(_b = items === null || items === void 0 ? void 0 : items[items.length - 1]) === null || _b === void 0 ? void 0 : _b.__updated}`);
                await this.collection.set.all(items);
                if (items.length < itemsCount)
                    break;
                page++;
            }
            catch (e) {
                break;
            }
            iteration++;
        }
    }
    /**
     * Override this method to provide actions or assertions to be executed before the deletion happens.
     * @param transaction - The transaction object
     * @param dbItems - The DB entry that is going to be deleted.
     */
    async canDeleteItems(dbItems, transaction) {
        const dependencies = await this.collectDependencies(dbItems, transaction);
        if (dependencies)
            throw new ts_common_1.ApiException(422, 'entity has dependencies').setErrorBody({
                type: 'has-dependencies',
                body: dependencies
            });
        //todo Add permission assertion, does the user have deletion permission over these objects
    }
    async collectDependencies(dbInstances, transaction) {
        const potentialErrors = await consts_1.canDeleteDispatcherV2.dispatchModuleAsync(this.dbDef.entityName, dbInstances, transaction);
        const dependencies = (0, ts_common_1.filterInstances)(potentialErrors.map(item => ((item === null || item === void 0 ? void 0 : item.conflictingIds.length) || 0) === 0 ? undefined : item));
        return dependencies.length > 0 ? dependencies : undefined;
    }
    async upgradeCollection(forceUpgrade) {
        const docs = await this.collection.doc.query(shared_1._EmptyQuery);
        const toDelete = docs.filter(doc => {
            return doc.ref.id !== doc.data._id;
        });
        let items = (0, ts_common_1.filterDuplicates)(docs.map(d => d.data), ts_common_1.dbObjectToId);
        // this should be paginated
        if (!forceUpgrade)
            items = items.filter(item => item._v !== this.dbDef.versions[0]);
        this.logWarning(`Upgrading instances: ${items.length} ${this.dbDef.entityName}s ....`);
        await (0, ts_common_1.batchAction)(items, this.dbDef.upgradeChunksSize || 200, async (chunk) => {
            this.logWarning(`Upgrading instance: ${chunk[0]._id}`);
            await this.upgradeInstances(chunk);
            this.logWarning(`setting multi instances: ${chunk.length} ${this.dbDef.entityName}s ....`);
            await this.set.multi(chunk);
        });
        if (toDelete.length > 0) {
            this.logWarning(`Need to delete docs: ${toDelete.length} ${this.dbDef.entityName}s ....`);
            await this.collection.delete.multi.allDocs(toDelete);
        }
    }
}
exports.ModuleBE_BaseDBV2 = ModuleBE_BaseDBV2;
//# sourceMappingURL=ModuleBE_BaseDBV2.js.map