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
exports.BaseDB_ModuleBE = void 0;
const ts_common_1 = require("@nu-art/ts-common");
const backend_1 = require("@nu-art/thunderstorm/backend");
const backend_2 = require("@nu-art/firebase/backend");
const validators_1 = require("../shared/validators");
const db_def_1 = require("./db-def");
const ModuleBE_SyncManager_1 = require("./ModuleBE_SyncManager");
const shared_1 = require("../shared");
class BaseDB_ModuleBE extends ts_common_1.Module {
    constructor(dbDef, appConfig) {
        super();
        this._deleteUnique = Object.freeze({
            read: (transaction, _id) => __awaiter(this, void 0, void 0, function* () {
                if (!_id)
                    throw new backend_1.ApiException(400, 'Cannot delete without id');
                const doc = yield transaction.newQueryUnique(this.collection, { where: { _id } });
                if (!doc)
                    throw new backend_1.ApiException(404, `Could not find ${this.config.itemName} with unique id: ${_id}`);
                return doc;
            }),
            write: (transaction, doc) => __awaiter(this, void 0, void 0, function* () {
                yield this.canDeleteDocument(transaction, [doc.get()]);
                const item = yield doc.delete(transaction.transaction);
                yield ModuleBE_SyncManager_1.ModuleBE_SyncManager.onItemsDeleted(this.config.collectionName, [item], this.config.uniqueKeys, transaction);
                return item;
            })
        });
        this._deleteMulti = Object.freeze({
            read: (transaction, deleteQuery) => __awaiter(this, void 0, void 0, function* () {
                return yield transaction.newQuery(this.collection, Object.assign(Object.assign({}, deleteQuery), { limit: deleteQuery.limit || BaseDB_ModuleBE.DeleteHardLimit }));
            }),
            write: (transaction, docs) => __awaiter(this, void 0, void 0, function* () {
                const items = docs.map(doc => doc.get());
                yield this.canDeleteDocument(transaction, items);
                yield Promise.all(docs.map((doc) => __awaiter(this, void 0, void 0, function* () { return doc.delete(transaction.transaction); })));
                yield ModuleBE_SyncManager_1.ModuleBE_SyncManager.onItemsDeleted(this.config.collectionName, items, this.config.uniqueKeys, transaction);
                const now = (0, ts_common_1.currentTimeMillis)();
                yield ModuleBE_SyncManager_1.ModuleBE_SyncManager.setLastUpdated(this.config.collectionName, now);
                return items;
            })
        });
        this._upsertUnique = Object.freeze({
            read: (transaction, instance) => __awaiter(this, void 0, void 0, function* () {
                this.assertObject(instance);
                let dbInstance;
                let where;
                if (instance._id) {
                    where = { _id: instance._id };
                }
                else if ((this.config.uniqueKeys.length > 1 || this.config.uniqueKeys[0] !== '_id') && this.config.uniqueKeys.every(key => (0, ts_common_1.exists)(instance[key]))) {
                    where = this.config.uniqueKeys.reduce((_where, key) => {
                        _where[key] = instance[key];
                        return _where;
                    }, {});
                }
                if (where) {
                    const doc = (yield transaction.newQueryUnique(this.collection, { where }));
                    if (doc)
                        return doc;
                }
                const timestamp = (0, ts_common_1.currentTimeMillis)();
                if (this.config.uniqueKeys[0] === '_id' && instance._id === undefined)
                    dbInstance = Object.assign(Object.assign({}, instance), { _id: this.generateId(), __created: timestamp, __updated: timestamp });
                else
                    dbInstance = Object.assign(Object.assign({}, instance), { _id: instance._id || this.generateId(), __created: instance.__created || timestamp, __updated: timestamp });
                const ref = this.collection.createDocumentReference(dbInstance._id);
                return new backend_2.DocWrapper(this.collection.wrapper, { ref, data: () => dbInstance });
            }),
            assert: (transaction, doc) => __awaiter(this, void 0, void 0, function* () {
                const dbInstance = doc.get();
                yield this._preUpsertProcessing(dbInstance, transaction);
                this.validateImpl(dbInstance);
                yield this.assertUniqueness(dbInstance, transaction);
            }),
            write: (transaction, doc) => __awaiter(this, void 0, void 0, function* () {
                const instance = doc.get();
                doc.set(instance, transaction.transaction);
                return instance;
            })
        });
        this.runInTransaction = (processor) => __awaiter(this, void 0, void 0, function* () {
            return this.collection.runInTransaction(processor);
        });
        const config = (0, db_def_1.getModuleBEConfig)(dbDef);
        const preConfig = Object.assign(Object.assign({}, config), appConfig);
        this.setDefaultConfig(preConfig);
        this.validator = config.validator;
        this.dbDef = dbDef;
    }
    init() {
        var _a;
        const firestore = backend_2.ModuleBE_Firebase.createAdminSession((_a = this.config) === null || _a === void 0 ? void 0 : _a.projectId).getFirestore();
        this.collection = firestore.getCollection(this.config.collectionName, this.config.uniqueKeys);
    }
    createFirebaseRef(_relativePath) {
        var _a;
        let relativePath = _relativePath;
        if (relativePath.startsWith('/'))
            relativePath = relativePath.substring(1);
        const path = `/state/${this.getName()}/${relativePath}`;
        return backend_2.ModuleBE_Firebase.createAdminSession((_a = this.config) === null || _a === void 0 ? void 0 : _a.projectId).getDatabase().ref(path);
    }
    getCollectionName() {
        return this.config.collectionName;
    }
    getItemName() {
        return this.config.itemName;
    }
    __onFirestoreBackupSchedulerAct() {
        return [{
                backupQuery: this.resolveBackupQuery(),
                collection: this.collection,
                keepInterval: 7 * ts_common_1.Day,
                minTimeThreshold: ts_common_1.Day,
                moduleKey: this.config.collectionName
            }];
    }
    resolveBackupQuery() {
        return shared_1._EmptyQuery;
    }
    deleteUnique(_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.runInTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                return this._deleteUnique.write(transaction, yield this._deleteUnique.read(transaction, _id));
            }));
        });
    }
    assertObject(instance) {
        if (Array.isArray(instance) || typeof instance !== 'object')
            throw new backend_1.ApiException(400, `Trying to upsert a ${typeof instance}!`);
    }
    delete(deleteQuery, toReturn = []) {
        return __awaiter(this, void 0, void 0, function* () {
            const start = (0, ts_common_1.currentTimeMillis)();
            toReturn.push(...yield this.runInTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                return this._deleteMulti.write(transaction, yield this._deleteMulti.read(transaction, deleteQuery));
            })));
            if (toReturn.length !== 0 && toReturn.length % BaseDB_ModuleBE.DeleteHardLimit === 0)
                yield this.delete(deleteQuery, toReturn);
            yield ModuleBE_SyncManager_1.ModuleBE_SyncManager.setLastUpdated(this.config.collectionName, start);
            return toReturn;
        });
    }
    querySync(syncQuery, request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.runInTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                const items = yield transaction.query(this.collection, syncQuery);
                const deletedItems = yield ModuleBE_SyncManager_1.ModuleBE_SyncManager.queryDeleted(this.config.collectionName, syncQuery, transaction);
                yield this.upgradeInstances(items);
                return { toUpdate: items, toDelete: deletedItems };
            }));
        });
    }
    deleteAll() {
        return this.delete(shared_1._EmptyQuery);
    }
    canDeleteDocument(transaction, dbInstances) {
        return __awaiter(this, void 0, void 0, function* () {
            const dependencies = yield this.collectDependencies(dbInstances, transaction);
            if (dependencies)
                throw new backend_1.ApiException(422, 'entity has dependencies').setErrorBody({ type: 'has-dependencies', body: dependencies });
        });
    }
    collectDependencies(dbInstances, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const potentialErrors = yield db_def_1.canDeleteDispatcher.dispatchModuleAsync(this.dbDef.entityName, dbInstances, transaction);
            const dependencies = (0, ts_common_1.filterInstances)(potentialErrors.map(item => ((item === null || item === void 0 ? void 0 : item.conflictingIds.length) || 0) === 0 ? undefined : item));
            return dependencies.length > 0 ? dependencies : undefined;
        });
    }
    assertExternalQueryUnique(instance, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const dbInstance = yield transaction.queryItem(this.collection, instance);
            if (!dbInstance) {
                const uniqueQuery = backend_2.FirestoreInterface.buildUniqueQuery(this.collection, instance);
                throw new backend_1.ApiException(404, `Could not find ${this.config.itemName} with unique query '${(0, ts_common_1.__stringify)(uniqueQuery)}'`);
            }
            return dbInstance;
        });
    }
    assertUniqueness(instance, transaction, request) {
        return __awaiter(this, void 0, void 0, function* () {
            const uniqueQueries = this.internalFilter(instance);
            if (uniqueQueries.length === 0)
                return;
            const dbInstances = yield Promise.all(uniqueQueries.map(uniqueQuery => {
                if (transaction)
                    return transaction.queryUnique(this.collection, { where: uniqueQuery, limit: 1 });
                return this.collection.queryUnique({ where: uniqueQuery });
            }));
            for (const idx in dbInstances) {
                const dbInstance = dbInstances[idx];
                if (!dbInstance || !this.config.uniqueKeys.find((key) => dbInstance[key] !== instance[key]))
                    continue;
                const query = uniqueQueries[idx];
                const message = (0, ts_common_1._keys)(query).reduce((carry, key) => {
                    return carry + '\n' + `${String(key)}: ${query[key]}`;
                }, `${this.config.itemName} uniqueness violation. There is already a document with`);
                this.logWarning(message);
                throw new backend_1.ApiException(422, message);
            }
        });
    }
    validateImpl(instance) {
        const results = (0, ts_common_1.tsValidateResult)(instance, this.validator);
        if (results) {
            this.onValidationError(instance, results);
        }
    }
    onValidationError(instance, results) {
        this.logError(`error validating ${this.dbDef.entityName}:`, instance, 'With Error: ', results);
        const errorBody = { type: 'bad-input', body: { result: results, input: instance } };
        throw new backend_1.ApiException(400, `error validating ${this.dbDef.entityName}`).setErrorBody(errorBody);
    }
    internalFilter(item) {
        return [];
    }
    _preUpsertProcessing(dbInstance, transaction, request) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.upgradeInstances([dbInstance]);
            yield this.preUpsertProcessing(dbInstance, transaction, request);
        });
    }
    upgradeInstances(dbInstances) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(dbInstances.map((dbInstance) => __awaiter(this, void 0, void 0, function* () {
                const instanceVersion = dbInstance._v;
                const currentVersion = this.config.versions[0];
                if (instanceVersion !== undefined && instanceVersion !== currentVersion)
                    try {
                        yield this.upgradeInstance(dbInstance, currentVersion);
                    }
                    catch (e) {
                        throw new backend_1.ApiException(500, `Error while upgrading db item "${this.config.itemName}"(${dbInstance._id}): ${instanceVersion} => ${currentVersion}`, e.message);
                    }
                dbInstance._v = currentVersion;
            })));
        });
    }
    upgradeInstance(dbInstance, toVersion) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    preUpsertProcessing(dbInstance, transaction, request) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    deleteCollection() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.collection.deleteAll();
        });
    }
    promoteCollection() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
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
                    const items = yield this.query(itemsToSyncQuery);
                    this.logInfo(`Page: ${page} Found: ${items.length} - first: ${(_a = items === null || items === void 0 ? void 0 : items[0]) === null || _a === void 0 ? void 0 : _a.__updated}   last: ${(_b = items === null || items === void 0 ? void 0 : items[items.length - 1]) === null || _b === void 0 ? void 0 : _b.__updated}`);
                    yield this.upsertAll(items);
                    if (items.length < itemsCount)
                        break;
                    page++;
                }
                catch (e) {
                    break;
                }
                iteration++;
            }
        });
    }
    createImpl_Read(transaction, instance, request) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.assertInstance(instance, transaction, request);
            return () => __awaiter(this, void 0, void 0, function* () { return transaction.insert(this.collection, instance, instance._id); });
        });
    }
    upsert(instance, transaction, request) {
        return __awaiter(this, void 0, void 0, function* () {
            const processor = (_transaction) => __awaiter(this, void 0, void 0, function* () {
                return (yield this.upsert_Read(instance, _transaction, request))();
            });
            let item;
            if (transaction)
                item = yield processor(transaction);
            else
                item = yield this.collection.runInTransaction(processor);
            yield ModuleBE_SyncManager_1.ModuleBE_SyncManager.setLastUpdated(this.config.collectionName, item.__updated);
            return item;
        });
    }
    insert(instance) {
        return __awaiter(this, void 0, void 0, function* () {
            const timestamp = (0, ts_common_1.currentTimeMillis)();
            const toInsert = Object.assign(Object.assign({}, instance), { _id: this.generateId(), __created: timestamp, __updated: timestamp });
            yield this.assertInstance(toInsert);
            return this.collection.insert(toInsert, toInsert._id);
        });
    }
    insertAll(instances) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.all(instances.map((instance) => this.insert(instance)));
        });
    }
    upsert_Read(instance, transaction, request) {
        return __awaiter(this, void 0, void 0, function* () {
            const timestamp = (0, ts_common_1.currentTimeMillis)();
            if (this.config.uniqueKeys[0] === '_id' && instance._id === undefined)
                return this.createImpl_Read(transaction, Object.assign(Object.assign({}, instance), { _id: this.generateId(), __created: timestamp, __updated: timestamp }), request);
            return this.upsertImpl_Read(transaction, Object.assign(Object.assign({}, instance), { _id: instance._id || this.generateId(), __created: instance.__created || timestamp, __updated: timestamp }), request);
        });
    }
    generateId() {
        return (0, ts_common_1.generateHex)(validators_1.dbIdLength);
    }
    upsertAll_Batched(instances, request) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, ts_common_1.batchAction)(instances, 500, (chunked) => __awaiter(this, void 0, void 0, function* () { return this.upsertAll(chunked, undefined, request); }));
        });
    }
    upsertAll(instances, transaction, request) {
        return __awaiter(this, void 0, void 0, function* () {
            if (instances.length === 0)
                return [];
            if (instances.length > 500) {
                if (transaction)
                    throw new ts_common_1.BadImplementationException('Firestore transaction supports maximum 500 at a time');
                return this.upsertAll_Batched(instances, request);
            }
            const processor = (_transaction) => __awaiter(this, void 0, void 0, function* () {
                const writes = yield Promise.all(yield this.upsertAllImpl_Read(instances, _transaction, request));
                return Promise.all(writes.map(write => write()));
            });
            let itemsToRet;
            if (transaction)
                itemsToRet = yield processor(transaction);
            else
                itemsToRet = yield this.collection.runInTransaction(processor);
            const latest = itemsToRet.reduce((toRet, current) => Math.max(toRet, current.__updated), itemsToRet[0].__updated);
            yield ModuleBE_SyncManager_1.ModuleBE_SyncManager.setLastUpdated(this.config.collectionName, latest);
            return itemsToRet;
        });
    }
    upsertAllImpl_Read(instances, transaction, request) {
        return __awaiter(this, void 0, void 0, function* () {
            const actions = [];
            instances.reduce((carry, instance) => {
                (0, ts_common_1.addItemToArray)(carry, this.upsert_Read(instance, transaction, request));
                return carry;
            }, actions);
            return Promise.all(actions);
        });
    }
    upsertImpl(transaction, dbInstance, request) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.upsertImpl_Read(transaction, dbInstance, request))();
        });
    }
    upsertImpl_Read(transaction, dbInstance, request) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.assertInstance(dbInstance, transaction, request);
            return transaction.upsert_Read(this.collection, dbInstance, dbInstance._id);
        });
    }
    assertInstance(dbInstance, transaction, request) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._preUpsertProcessing(dbInstance, transaction, request);
            this.validateImpl(dbInstance);
            yield this.assertUniqueness(dbInstance, transaction, request);
        });
    }
    queryUnique(where, transaction, request) {
        return __awaiter(this, void 0, void 0, function* () {
            let dbItem;
            if (transaction)
                dbItem = yield transaction.queryUnique(this.collection, { where });
            else
                dbItem = yield this.collection.queryUnique({ where });
            if (!dbItem)
                throw new backend_1.ApiException(404, `Could not find ${this.config.itemName} with unique query: ${JSON.stringify(where)}`);
            yield this.upgradeInstances([dbItem]);
            return dbItem;
        });
    }
    query(query, transaction, request) {
        return __awaiter(this, void 0, void 0, function* () {
            let items;
            if (transaction)
                items = yield transaction.query(this.collection, query);
            else
                items = yield this.collection.query(query);
            yield this.upgradeInstances(items);
            return items;
        });
    }
    patch(instance, propsToPatch, request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.collection.runInTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                const dbInstance = yield this.assertExternalQueryUnique(instance, transaction);
                const wrongKey = propsToPatch === null || propsToPatch === void 0 ? void 0 : propsToPatch.find(prop => this.config.lockKeys.includes(prop));
                if (wrongKey)
                    throw new ts_common_1.BadImplementationException(`Key ${String(wrongKey)} is part of the 'lockKeys' and cannot be updated.`);
                (0, ts_common_1._keys)(instance).forEach(key => {
                    if (this.config.lockKeys.includes(key) || (propsToPatch && !propsToPatch.includes(key))) {
                        delete instance[key];
                    }
                });
                const mergedObject = (0, ts_common_1.merge)(dbInstance, instance);
                mergedObject.__created = mergedObject.__created || (0, ts_common_1.currentTimeMillis)();
                mergedObject.__updated = (0, ts_common_1.currentTimeMillis)();
                yield this.assertUniqueness(mergedObject, transaction, request);
                const item = yield this.upsertImpl(transaction, mergedObject, request);
                yield ModuleBE_SyncManager_1.ModuleBE_SyncManager.setLastUpdated(this.config.collectionName, item.__updated);
                return item;
            }));
        });
    }
}
BaseDB_ModuleBE.DeleteHardLimit = 250;
exports.BaseDB_ModuleBE = BaseDB_ModuleBE;
//# sourceMappingURL=BaseDB_ModuleBE.js.map