"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleBE_SyncManager = exports.ModuleBE_SyncManager_Class = void 0;
const backend_1 = require("@nu-art/firebase/backend");
const backend_2 = require("@nu-art/thunderstorm/backend");
const ts_common_1 = require("@nu-art/ts-common");
const shared_1 = require("../shared");
const BaseDB_ModuleBE_1 = require("./BaseDB_ModuleBE");
class ModuleBE_SyncManager_Class extends ts_common_1.Module {
    constructor() {
        super();
        this.prepareItemToDelete = (collectionName, item, uniqueKeys = ['_id']) => {
            const { _id, __updated, __created, _v } = item;
            const deletedItem = { _id, __updated, __created, _v, __collectionName: collectionName };
            uniqueKeys.forEach(key => {
                deletedItem[key] = item[key];
            });
            return deletedItem;
        };
        this.__onCleanupInvoked = () => __awaiter(this, void 0, void 0, function* () {
            if (!this.config.retainDeletedCount)
                return this.logWarning('Will not run cleanup of deleted values:\n  No "retainDeletedCount" was specified in config..');
            let deletedCount = yield this.deletedCount.get();
            if (deletedCount === undefined) {
                deletedCount = (yield this.collection.query(shared_1._EmptyQuery)).length;
                yield this.deletedCount.set(deletedCount);
            }
            const toDeleteCount = deletedCount - this.config.retainDeletedCount;
            if (toDeleteCount <= 0)
                return;
            this.logDebug('Docs to delete', deletedCount);
            this.logDebug('Docs to retain', this.config.retainDeletedCount);
            const deleted = yield this.collection.delete({ limit: toDeleteCount, orderBy: [{ key: '__updated', order: 'asc' }] });
            let newDeletedCount = deletedCount - deleted.length;
            if (deleted.length !== toDeleteCount) {
                this.logError(`Expected to delete ${toDeleteCount} but actually deleted ${deleted.length}`);
                newDeletedCount = (yield this.collection.query(shared_1._EmptyQuery)).length;
            }
            yield this.deletedCount.set(newDeletedCount);
            const map = deleted.map(item => item.__collectionName);
            const keys = (0, ts_common_1.filterDuplicates)(map);
            yield Promise.all(keys.map(key => {
                const newestDeletedItem = deleted.find(deletedItem => deletedItem.__collectionName === key);
                this.logDebug(`setting oldest deleted timestamp ${key} = ${newestDeletedItem.__updated}`);
                return this.setOldestDeleted(key, newestDeletedItem.__updated);
            }));
        });
        this.fetchDBSyncData = (_, request) => __awaiter(this, void 0, void 0, function* () {
            const fbSyncData = yield this.syncData.get({});
            const missingModules = this.dbModules.filter(dbModule => !fbSyncData[dbModule.getCollectionName()]);
            if (missingModules.length) {
                this.logWarning(`Syncing missing modules: `, missingModules.map(module => module.getCollectionName()));
                const query = { limit: 1, orderBy: [{ key: '__updated', order: 'asc' }] };
                const newestItems = (yield Promise.all(missingModules.map(missingModule => missingModule.query(query))));
                newestItems.forEach((item, index) => { var _a; return fbSyncData[missingModules[index].getCollectionName()] = { lastUpdated: ((_a = item[0]) === null || _a === void 0 ? void 0 : _a.__updated) || 0 }; });
                yield this.syncData.set(fbSyncData);
            }
            const syncData = (0, ts_common_1._keys)(fbSyncData).reduce((response, dbName) => {
                response.push(Object.assign({ name: String(dbName) }, fbSyncData[dbName]));
                return response;
            }, []);
            return {
                syncData
            };
        });
        this.setMinLevel(ts_common_1.LogLevel.Debug);
        this.checkSyncApi = (0, backend_2.createQueryServerApi)(shared_1.ApiDef_SyncManager.v1.checkSync, this.fetchDBSyncData);
        (0, backend_2.addRoutes)([this.checkSyncApi]);
        this.setDefaultConfig({ retainDeletedCount: 1000 });
    }
    onItemsDeleted(collectionName, items, uniqueKeys = ['_id'], transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const toInsert = items.map(item => this.prepareItemToDelete(collectionName, item, uniqueKeys));
            const now = (0, ts_common_1.currentTimeMillis)();
            toInsert.forEach(item => item.__updated = now);
            yield transaction.insertAll(this.collection, toInsert);
            let deletedCount = yield this.deletedCount.get(0);
            deletedCount += items.length;
            yield this.deletedCount.set(deletedCount);
        });
    }
    queryDeleted(collectionName, query, transaction) {
        const finalQuery = Object.assign(Object.assign({}, query), { where: Object.assign(Object.assign({}, query.where), { __collectionName: collectionName }) });
        return transaction.query(this.collection, finalQuery);
    }
    init() {
        const firestore = backend_1.ModuleBE_Firebase.createAdminSession().getFirestore();
        this.collection = firestore.getCollection('__deleted__docs');
        this.dbModules = this.manager.filterModules(module => module instanceof BaseDB_ModuleBE_1.BaseDB_ModuleBE);
        this.database = backend_1.ModuleBE_Firebase.createAdminSession().getDatabase();
        this.syncData = this.database.ref(`/state/${this.getName()}/syncData`);
        this.deletedCount = this.database.ref(`/state/${this.getName()}/deletedCount`);
    }
    setLastUpdated(collectionName, lastUpdated) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.database.patch(`/state/${this.getName()}/syncData/${collectionName}`, { lastUpdated });
        });
    }
    setOldestDeleted(collectionName, oldestDeleted) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.database.patch(`/state/${this.getName()}/syncData/${collectionName}`, { oldestDeleted });
        });
    }
}
exports.ModuleBE_SyncManager_Class = ModuleBE_SyncManager_Class;
exports.ModuleBE_SyncManager = new ModuleBE_SyncManager_Class();
//# sourceMappingURL=ModuleBE_SyncManager.js.map