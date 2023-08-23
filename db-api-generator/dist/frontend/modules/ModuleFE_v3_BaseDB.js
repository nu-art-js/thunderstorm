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
exports.ModuleFE_v3_BaseDB = void 0;
const frontend_1 = require("@nu-art/thunderstorm/frontend");
const ts_common_1 = require("@nu-art/ts-common");
const consts_1 = require("./consts");
const consts_2 = require("../consts");
const firebase_1 = require("@nu-art/firebase");
const v3_db_def_1 = require("../v3-db-def");
class ModuleFE_v3_BaseDB extends ts_common_1.Module {
    constructor(dbDef, defaultDispatcher) {
        super();
        // @ts-ignore
        this.ModuleFE_BaseDB = true;
        this.getCollectionName = () => {
            return this.config.dbConfig.name;
        };
        this.dispatchSingle = (event, item) => {
            var _a, _b;
            (_a = this.defaultDispatcher) === null || _a === void 0 ? void 0 : _a.dispatchModule(event, item);
            (_b = this.defaultDispatcher) === null || _b === void 0 ? void 0 : _b.dispatchUI(event, item);
        };
        this.dispatchMulti = (event, items) => {
            var _a, _b;
            (_a = this.defaultDispatcher) === null || _a === void 0 ? void 0 : _a.dispatchModule(event, items);
            (_b = this.defaultDispatcher) === null || _b === void 0 ? void 0 : _b.dispatchUI(event, items);
        };
        this.onSyncCompleted = async (syncData) => {
            this.logDebug(`onSyncCompleted: ${this.config.dbConfig.name}`);
            try {
                await this.IDB.syncIndexDb(syncData.toUpdate, syncData.toDelete);
            }
            catch (e) {
                this.logError('Error while syncing', e);
                throw e;
            }
            await this.cache.load();
            this.setDataStatus(consts_1.DataStatus.ContainsData);
            if (syncData.toDelete)
                this.dispatchMulti(consts_2.EventType_DeleteMulti, syncData.toDelete);
            if (syncData.toUpdate)
                this.dispatchMulti(consts_2.EventType_Query, syncData.toUpdate);
        };
        this.onEntriesDeleted = async (items) => {
            await this.IDB.syncIndexDb([], items);
            // @ts-ignore
            this.cache.onEntriesDeleted(items);
            this.dispatchMulti(consts_2.EventType_DeleteMulti, items);
        };
        this.onEntryDeleted = async (item) => {
            await this.IDB.syncIndexDb([], [item]);
            // @ts-ignore
            this.cache.onEntriesDeleted([item]);
            this.dispatchSingle(consts_2.EventType_Delete, item);
        };
        this.onEntriesUpdated = async (items) => {
            await this.IDB.syncIndexDb(items);
            // @ts-ignore
            this.cache.onEntriesUpdated(items);
            this.dispatchMulti(consts_2.EventType_UpsertAll, items.map(item => item));
        };
        this.onEntryUpdated = async (item, original) => {
            return this.onEntryUpdatedImpl(original._id ? consts_2.EventType_Update : consts_2.EventType_Create, item);
        };
        this.onEntryPatched = async (item) => {
            return this.onEntryUpdatedImpl(consts_2.EventType_Patch, item);
        };
        this.onGotUnique = async (item) => {
            return this.onEntryUpdatedImpl(consts_2.EventType_Unique, item);
        };
        this.onQueryReturned = async (toUpdate, toDelete = []) => {
            await this.IDB.syncIndexDb(toUpdate, toDelete);
            // @ts-ignore
            this.cache.onEntriesUpdated(toUpdate);
            // @ts-ignore
            this.cache.onEntriesDeleted(toDelete);
            this.dispatchMulti(consts_2.EventType_Query, toUpdate);
        };
        this.defaultDispatcher = defaultDispatcher;
        const config = (0, v3_db_def_1.getModuleFEConfigV3)(dbDef);
        this.validator = config.validator;
        this.setDefaultConfig(config);
        //Set Statuses
        this.dataStatus = consts_1.DataStatus.NoData;
        this.cache = new MemCache(this, config.dbConfig.uniqueKeys);
        this.IDB = new IDBCache(config.dbConfig, config.versions[0]);
        this.dbDef = dbDef;
    }
    setDataStatus(status) {
        this.logDebug(`Data status updated: ${consts_1.DataStatus[this.dataStatus]} => ${consts_1.DataStatus[status]}`);
        if (this.dataStatus === status)
            return;
        this.dataStatus = status;
        this.OnDataStatusChanged();
    }
    OnDataStatusChanged() {
        consts_1.syncDispatcher.dispatchModule(this);
        consts_1.syncDispatcher.dispatchUI(this);
    }
    getDataStatus() {
        return this.dataStatus;
    }
    init() {
    }
    async __onClearWebsiteData(resync) {
        await this.IDB.clear(resync);
        this.setDataStatus(consts_1.DataStatus.NoData);
    }
    validateImpl(instance) {
        const results = (0, ts_common_1.tsValidateResult)(instance, this.validator);
        if (results) {
            this.onValidationError(instance, results);
        }
    }
    onValidationError(instance, results) {
        this.logError(`Error validating object:`, instance, 'With Error: ', results);
        throw new ts_common_1.ValidationException('Error validating object', instance, results);
    }
    async onEntryUpdatedImpl(event, item) {
        this.validateImpl(item);
        await this.IDB.syncIndexDb([item]);
        // @ts-ignore
        this.cache.onEntriesUpdated([item]);
        this.dispatchSingle(event, item);
    }
}
exports.ModuleFE_v3_BaseDB = ModuleFE_v3_BaseDB;
class IDBCache extends ts_common_1.Logger {
    constructor(dbConfig, currentVersion) {
        super(`indexdb-${dbConfig.name}`);
        this.forEach = async (processor) => {
            const allItems = await this.query();
            allItems.forEach(processor);
            return allItems;
        };
        this.clear = async (resync = false) => {
            this.lastSync.delete();
            return this.db.clearDB();
        };
        this.delete = async (resync = false) => {
            this.lastSync.delete();
            return this.db.deleteDB();
        };
        this.query = async (query, indexKey) => (await this.db.query({
            query,
            indexKey
        })) || [];
        /**
         * Iterates over all DB objects in the related collection, and returns all the items that pass the filter
         *
         * @param {function} filter - Boolean returning function, to determine which objects to return.
         * @param {Object} [query] - A query object
         *
         * @return Array of items or empty array
         */
        this.filter = async (filter, query) => this.db.queryFilter(filter, query);
        /**
         * Iterates over all DB objects in the related collection, and returns the first item that passes the filter
         *
         * @param {function} filter - Boolean returning function, to determine which object to return.
         *
         * @return a single item or undefined
         */
        this.find = async (filter) => this.db.queryFind(filter);
        /**
         * Iterates over all DB objects in the related collection, and returns an array of items based on the mapper.
         *
         * @param {function} mapper - Function that returns data to map for the object
         * @param {function} [filter] - Boolean returning function, to determine which item to map.
         * @param {Object} [query] - A query object
         *
         * @return An array of mapped items
         */
        this.map = async (mapper, filter, query) => this.db.WIP_queryMap(mapper, filter, query);
        /**
         * iterates over all DB objects in the related collection, and reduces them to a single value based on the reducer.
         * @param {function} reducer - Function that determines who to reduce the array.
         * @param {*} initialValue - An initial value for the reducer
         * @param {function} [filter] - Function that determines which DB objects to reduce.
         * @param {Object} [query] - A query Object.
         *
         * @return a single reduced value.
         */
        this.reduce = async (reducer, initialValue, filter, query) => this.db.queryReduce(reducer, initialValue, filter, query);
        this.unique = async (_key) => {
            if (_key === undefined)
                return _key;
            const key = typeof _key === 'string' ? { _id: _key } : _key;
            return this.db.get(key);
        };
        this.db = frontend_1.IndexedDBV3.getOrCreate(dbConfig);
        this.lastSync = new frontend_1.StorageKey('last-sync--' + dbConfig.name);
        this.lastVersion = new frontend_1.StorageKey('last-version--' + dbConfig.name);
        const previousVersion = this.lastVersion.get();
        this.lastVersion.set(currentVersion);
        if (!previousVersion || previousVersion === currentVersion)
            return;
        this.logInfo(`Cleaning up & Sync...`);
        this.clear(true)
            .then(() => this.logInfo(`Cleaning up & Sync: Completed`))
            .catch((e) => this.logError(`Cleaning up & Sync: ERROR`, e));
    }
    getLastSync() {
        return this.lastSync.get(0);
    }
    async syncIndexDb(toUpdate, toDelete = []) {
        await this.db.upsertAll(toUpdate);
        await this.db.deleteAll(toDelete);
        let latest = -1;
        latest = toUpdate.reduce((toRet, current) => Math.max(toRet, current.__updated), latest);
        latest = toDelete.reduce((toRet, current) => Math.max(toRet, current.__updated), latest);
        if (latest !== -1)
            this.lastSync.set(latest);
    }
}
class MemCache {
    constructor(module, keys) {
        this.loaded = false;
        this.forEach = (processor) => {
            this._array.forEach(processor);
        };
        this.clear = () => {
            this.setCache([]);
        };
        this.load = async (cacheFilter) => {
            this.module.logDebug(`${this.module.getName()} cache is loading`);
            let allItems;
            this.cacheFilter = cacheFilter;
            if (this.cacheFilter)
                allItems = await this.module.IDB.filter(this.cacheFilter);
            else
                allItems = await this.module.IDB.query();
            const frozenItems = allItems.map((item) => Object.freeze(item));
            this.setCache(frozenItems);
            this.loaded = true;
            this.module.logDebug(`${this.module.getName()} cache finished loading, count: ${this.all().length}`);
        };
        this.unique = (_key) => {
            if (_key === undefined)
                return _key;
            const _id = typeof _key === 'string' ? _key : (('_id' in _key && typeof _key['_id'] === 'string') ? _key['_id'] : (0, firebase_1.composeDbObjectUniqueId)(_key, this.keys));
            return this._map[_id];
        };
        this.all = () => {
            return this._array;
        };
        this.allMutable = () => {
            return [...this._array];
        };
        this.filter = (filter) => {
            return this.all().filter(filter);
        };
        this.find = (filter) => {
            return this.all().find(filter);
        };
        this.map = (mapper) => {
            return this.all().map(mapper);
        };
        this.sort = (map = i => i, invert = false) => {
            return (0, ts_common_1.sortArray)(this.allMutable(), map, invert);
        };
        this.arrayToMap = (getKey, map = {}) => (0, ts_common_1.arrayToMap)(this.allMutable(), getKey, map);
        this.module = module;
        this.keys = keys;
        this.clear();
    }
    // @ts-ignore
    onEntriesDeleted(itemsDeleted) {
        const ids = new Set(itemsDeleted.map(ts_common_1.dbObjectToId));
        this.setCache(this.filter(i => !ids.has(i._id)));
    }
    // @ts-ignore
    onEntriesUpdated(itemsUpdated) {
        const frozenItems = itemsUpdated.map(item => Object.freeze(item));
        const ids = new Set(itemsUpdated.map(ts_common_1.dbObjectToId));
        const toCache = this.filter(i => !ids.has(i._id));
        toCache.push(...frozenItems);
        this.setCache(toCache);
    }
    setCache(cacheArray) {
        this._map = Object.freeze(Object.assign({}, (0, ts_common_1.arrayToMap)(cacheArray, ts_common_1.dbObjectToId_V3)));
        this._array = Object.freeze(cacheArray);
    }
}
//# sourceMappingURL=ModuleFE_v3_BaseDB.js.map