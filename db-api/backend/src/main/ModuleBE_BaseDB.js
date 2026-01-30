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
import { _keys, ApiException, asArray, BadImplementationException, batchActionParallel, currentTimeMillis, dbObjectToId, filterDuplicates, filterInstances, getDotNotatedValue, merge, Module } from '@nu-art/ts-common';
import { ModuleBE_Firebase, } from '@nu-art/firebase-backend';
import { MemKey_DeletedDocs } from '@nu-art/firebase-backend/firestore-v3/consts';
const CONST_DefaultWriteChunkSize = 200;
/**
 * An abstract base class used for implementing CRUD operations on a specific collection.
 *
 * By default, it exposes API endpoints for creating, deleting, updating, querying and querying for unique document.
 */
export class ModuleBE_BaseDB extends Module {
    // @ts-ignore
    ModuleBE_BaseDBV2 = true;
    // private static DeleteHardLimit = 250;
    collection;
    dbDef;
    query;
    create;
    set;
    delete;
    doc;
    runTransaction;
    constructor(dbDef, appConfig) {
        super();
        const config = getModuleBEConfig(dbDef);
        const preConfig = { chunksSize: CONST_DefaultWriteChunkSize, ...config, ...appConfig };
        // @ts-ignore
        this.setDefaultConfig(preConfig);
        this.dbDef = dbDef;
        this.canDeleteItems.bind(this);
        this._preWriteProcessing.bind(this);
        this._postWriteProcessing.bind(this);
        this.upgradeInstances.bind(this);
        this.manipulateQuery.bind(this);
        this.collectDependencies.bind(this);
    }
    __collectEntityDependencies = async (type, itemIds, transaction) => {
        //Assert this collection has dependencies fields to go over
        const dependencyDefs = (this.dbDef.dependencies ?? {});
        const dependencyDefKeys = _keys(dependencyDefs).filter(key => dependencyDefs[key].dbKey === type);
        if (!dependencyDefKeys.length)
            return;
        //Collect all conflicting item queries
        const conflictItemQueries = dependencyDefKeys.reduce((acc, dependencyDefKey) => {
            const dependencyDef = dependencyDefs[dependencyDefKey];
            let whereClause;
            switch (dependencyDef.fieldType) {
                case 'string':
                    whereClause = ids => ({ [dependencyDefKey]: { $in: ids } });
                    break;
                case 'string[]':
                    whereClause = ids => ({ [dependencyDefKey]: { $aca: ids } });
                    break;
                default:
                    throw new BadImplementationException(`Proto Dependency fieldType is not 'string'/'string[]'. Cannot check for EntityDependency for collection '${this.dbDef.dbKey}'.`);
            }
            acc.push(batchActionParallel(itemIds, 10, async (ids) => this.query.unManipulatedQuery({ where: whereClause(ids) }, transaction)));
            return acc;
        }, []);
        if (!conflictItemQueries.length)
            return;
        //Get all conflicting items
        let conflictingItems = filterInstances((await Promise.all(conflictItemQueries)).flat());
        conflictingItems = filterDuplicates(conflictingItems, dbObjectToId);
        //Filter out conflicting items that were already deleted in this transaction
        const ignoredInThisTransaction = MemKey_DeletedDocs.get([]).find(item => item.transaction === transaction);
        if (ignoredInThisTransaction) {
            //The key associated with this collection
            const ignoredForThisCollection = ignoredInThisTransaction.deleted[this.dbDef.dbKey];
            //Filter out all ids of items which were already deleted in this transaction
            conflictingItems = conflictingItems.filter(object => !ignoredForThisCollection?.has(object._id));
        }
        return {
            dbKey: type,
            dependencyMap: this.mapConflicts(conflictingItems, itemIds, dependencyDefKeys),
        };
    };
    mapConflicts = (conflictItems, itemIds, conflictFields) => {
        return itemIds.reduce((acc, itemId) => {
            const conflictingItems = conflictItems.filter(item => {
                for (const field of conflictFields) {
                    const value = getDotNotatedValue(field, item);
                    if (asArray(value).includes(itemId))
                        return true;
                }
                return false;
            });
            if (conflictingItems.length)
                acc[itemId] = { [this.dbDef.dbKey]: conflictingItems.map(dbObjectToId) };
            return acc;
        }, {});
    };
    /**
     * Executed during the initialization of the module.
     * The collection reference is set in this method.
     */
    init() {
        const firestore = ModuleBE_Firebase.createAdminSession(this.config?.projectId).getFirestoreV3();
        this.collection = firestore.getCollection(this.dbDef, {
            canDeleteItems: this.canDeleteItems.bind(this),
            preWriteProcessing: this._preWriteProcessing.bind(this),
            postWriteProcessing: this._postWriteProcessing.bind(this),
            upgradeInstances: this.upgradeInstances.bind(this),
            manipulateQuery: this.manipulateQuery.bind(this)
        });
        this.runTransaction = this.collection.runTransaction;
        const wrapInTryCatch = (input, path) => _keys(input).reduce((acc, key) => {
            const value = input[key];
            const newPath = path ? `${path}.${String(key)}` : String(key);
            if (typeof value === 'function') {
                acc[key] = (async (...args) => {
                    try {
                        return await value(...args);
                    }
                    catch (e) {
                        this.logError(`Error while calling "${newPath}"`);
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
    querySync = async (syncQuery) => {
        const items = await this.collection.query.custom(syncQuery);
        const deletedItems = await ModuleBE_SyncManager.queryDeleted(this.dbDef.dbKey, syncQuery);
        await this.upgradeInstances(items);
        return { toUpdate: items, toDelete: deletedItems };
    };
    _preWriteProcessing = async (dbItem, originalDbInstance, transaction, upgrade = true) => {
        await this.preWriteProcessing(dbItem, originalDbInstance, transaction);
    };
    /**
     * Override this method to customize the processing that should be done before create, set or update.
     *
     * @param transaction - The transaction object.
     * @param dbInstance - The DB entry for which the uniqueness is being asserted.
     * @param originalDbInstance - The DB instance fetched from remote firestore.
     */
    async preWriteProcessing(dbInstance, originalDbInstance, transaction) {
    }
    _postWriteProcessing = async (data, actionType, transaction) => {
        const now = currentTimeMillis();
        if (data.updated && !(Array.isArray(data.updated) && data.updated.length === 0)) {
            const latestUpdated = Array.isArray(data.updated) ?
                data.updated.reduce((toRet, current) => Math.max(toRet, current.__updated), data.updated[0].__updated) :
                data.updated.__updated;
            await ModuleBE_SyncManager.setLastUpdated(this.dbDef.dbKey, latestUpdated);
        }
        if (data.deleted && !(Array.isArray(data.updated) && data.updated.length === 0)) {
            await ModuleBE_SyncManager.onItemsDeleted(this.dbDef.dbKey, asArray(data.deleted), this.config.uniqueKeys, transaction);
            await ModuleBE_SyncManager.setLastUpdated(this.dbDef.dbKey, now);
        }
        else if (data.deleted === null)
            // this means the whole collection has been deleted - setting the oldestDeleted to now will trigger a clean sync
            await ModuleBE_SyncManager.setOldestDeleted(this.dbDef.dbKey, now);
        await this.postWriteProcessing(data, actionType, transaction);
    };
    /**
     * Override this method to customize processing that should be done after create, set, update or delete.
     * @param data
     * @param actionType create/set/update/delete
     * @param transaction
     */
    async postWriteProcessing(data, actionType, transaction) {
    }
    manipulateQuery(query) {
        return query;
    }
    preUpsertProcessing;
    /**
     * Override this method to provide actions or assertions to be executed before the deletion happens.
     * @param transaction - The transaction object
     * @param dbItems - The DB entry that is going to be deleted.
     */
    async canDeleteItems(dbItems, transaction) {
        const dependencies = await this.collectDependencies(dbItems, transaction);
        if (dependencies)
            throw new ApiException(422, 'entity has dependencies').setErrorBody({
                type: 'entity-has-dependencies',
                data: dependencies
            });
    }
    async collectDependencies(dbInstances, transaction) {
        const dependencyResponses = await dispatch_CollectEntityDependencies.dispatchModuleAsync(this.dbDef.dbKey, dbInstances.map(dbObjectToId), transaction);
        const filtered = filterInstances(dependencyResponses);
        if (!filtered.length)
            return undefined;
        const merged = filtered.reduce((acc, dependency) => merge(acc, dependency));
        return _keys(merged.dependencyMap).length ? merged : undefined;
    }
    versionUpgrades = {};
    /**
     * Upgrades the entity from the given version to the next one (to the same version if the given version is the latest)
     * @param version - The version we start from
     * @param processor
     */
    registerVersionUpgradeProcessor(version, processor) {
        this.versionUpgrades[version] = processor;
    }
    /**
     * Check if the collection has at least one item without the latest version. Version[0] is the latest version.
     */
    isCollectionUpToDate = async () => {
        return (await this.query.unManipulatedQuery({
            limit: 1,
            where: { _v: { $neq: this.dbDef.versions[0] } }
        })).length === 0;
    };
    upgradeCollection = async (force = false) => {
        return this.processCollection(async (instances) => {
            const instancesToSave = await this.upgradeInstances(instances, force);
            // @ts-ignore
            await this.collection.upgradeInstances(instancesToSave);
        });
    };
    processCollection = async (processInstances) => {
        let docs;
        const itemsCount = this.config.chunksSize;
        const query = {
            limit: { page: 0, itemsCount },
        };
        while ((docs = await this.collection.doc.unManipulatedQuery(query)).length > 0) {
            // this is old Backward compatible from before the assertion of unique ids where the doc ref is the _id of the doc
            const toDelete = docs.filter(doc => {
                return doc.ref.id !== doc.data._id;
            });
            const instances = docs.map(d => d.data);
            this.logWarning(`Upgrading batch(${query.limit.page}) found instances(${instances.length}) for entity: "${this.dbDef.entityName}" ....`);
            await processInstances(instances);
            if (toDelete.length > 0) {
                this.logWarning(`Need to delete docs: ${toDelete.length} ${this.dbDef.entityName}s ....`);
                await this.collection.delete.multi.allDocs(toDelete);
            }
            query.limit.page++;
        }
    };
    async upgradeInstances(instances, force = false) {
        let instancesToSave = [];
        for (let i = this.config.versions.length - 1; i >= 0; i--) {
            const version = this.config.versions[i];
            const instancesToUpgrade = instances.filter(instance => instance._v === version);
            const nextVersion = this.config.versions[i - 1] ?? version;
            const versionTransition = `${version} => ${nextVersion}`;
            if (instancesToUpgrade.length === 0) {
                this.logVerbose(`No instances to upgrade from ${versionTransition}`);
                continue;
            }
            const upgradeProcessor = this.versionUpgrades[version];
            if (!upgradeProcessor) {
                this.logVerbose(`Will not update ${instancesToUpgrade.length} instances of version ${versionTransition}`);
                this.logVerbose(`No upgrade processor for: ${versionTransition}`);
            }
            else {
                this.logVerbose(`Upgrade instances(${instancesToUpgrade.length}): ${versionTransition}`);
                await upgradeProcessor?.(instancesToUpgrade);
                instancesToSave.push(...instancesToUpgrade);
            }
            instancesToSave = filterDuplicates(instancesToSave);
            instancesToUpgrade.forEach(instance => instance._v = nextVersion);
        }
        return force ? instances : instancesToSave;
    }
}
//# sourceMappingURL=ModuleBE_BaseDB.js.map