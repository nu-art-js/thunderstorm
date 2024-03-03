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

import {_EmptyQuery, Clause_Where, DB_EntityDependency, EntityDependencyError, FirestoreQuery,} from '@nu-art/firebase';
import {
	_keys,
	ApiException,
	asArray,
	BadImplementationException,
	batchActionParallel,
	currentTimeMillis,
	DB_Object,
	DBDef_V3,
	dbObjectToId,
	DBProto,
	filterDuplicates,
	filterInstances,
	flatArray,
	Module,
	UniqueId
} from '@nu-art/ts-common';
import {ModuleBE_Firebase,} from '@nu-art/firebase/backend';
import {
	FirestoreCollectionV3,
	PostWriteProcessingData
} from '@nu-art/firebase/backend/firestore-v3/FirestoreCollectionV3';
import {canDeleteDispatcherV2} from '@nu-art/firebase/backend/firestore-v2/consts';
import {DBApiBEConfigV3, getModuleBEConfigV3} from '../../core/v3-db-def';
import {ModuleBE_SyncManager} from '../sync-manager/ModuleBE_SyncManager';
import {DocWrapperV3} from '@nu-art/firebase/backend/firestore-v3/DocWrapperV3';
import {Response_DBSync} from '../../../shared/sync-manager/types';
import {CanDeleteDBEntitiesProto} from '@nu-art/firebase/backend/firestore-v3/types';
import {Transaction} from 'firebase-admin/firestore';
import {canDeleteDispatcherV3, MemKey_DeletedDocs} from '@nu-art/firebase/backend/firestore-v3/consts';


export type BaseDBApiConfigV3 = {
	projectId?: string,
	chunksSize: number
}

export type DBApiConfigV3<Proto extends DBProto<any>> = BaseDBApiConfigV3 & DBApiBEConfigV3<Proto>
const CONST_DefaultWriteChunkSize = 200;

/**
 * An abstract base class used for implementing CRUD operations on a specific collection.
 *
 * By default, it exposes API endpoints for creating, deleting, updating, querying and querying for unique document.
 */
export abstract class ModuleBE_BaseDBV3<Proto extends DBProto<any>, ConfigType = any,
	Config extends ConfigType & DBApiConfigV3<Proto> = ConfigType & DBApiConfigV3<Proto>>
	extends Module<Config>
	implements CanDeleteDBEntitiesProto {

	// @ts-ignore
	private readonly ModuleBE_BaseDBV2 = true;

	// private static DeleteHardLimit = 250;
	public collection!: FirestoreCollectionV3<Proto>;
	public dbDef: DBDef_V3<Proto>;
	public query!: FirestoreCollectionV3<Proto>['query'];
	public create!: FirestoreCollectionV3<Proto>['create'];
	public set!: FirestoreCollectionV3<Proto>['set'];
	public delete!: FirestoreCollectionV3<Proto>['delete'];
	public doc!: FirestoreCollectionV3<Proto>['doc'];
	public runTransaction!: FirestoreCollectionV3<Proto>['runTransaction'];

	protected constructor(dbDef: DBDef_V3<Proto>, appConfig?: BaseDBApiConfigV3) {
		super();

		const config = getModuleBEConfigV3(dbDef);

		const preConfig = {chunksSize: CONST_DefaultWriteChunkSize, ...config, ...appConfig};
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

	/**
	 * Check if the dbName in type exists in this proto's dependencies.
	 * If it doesn't- return nothing.
	 * If it does- return conflict ids.
	 */
	async __canDeleteEntitiesProto<T extends DBProto<any>>(toDeleteDbName: T['dbKey'], itemIdsToDelete: string[], transaction?: Transaction) {
		const result: DB_EntityDependency = {
			collectionKey: this.dbDef.entityName,
			conflictingIds: []
		};

		const dependencies = this.dbDef.dependencies;
		if (!dependencies)
			return result;

		const promises: Promise<Proto['dbType'][]>[] = [];
		_keys(dependencies).map(key => {
			if (dependencies[key].dbKey !== toDeleteDbName)
				return;

			promises.push(batchActionParallel(itemIdsToDelete,
				10, async ids => {
					let query = undefined;
					if (dependencies[key].fieldType === 'string')
						query = {[key]: {$in: ids}};

					if (dependencies[key].fieldType === 'string[]')
						query = {[key]: {$aca: ids}};

					if (query === undefined)
						throw new BadImplementationException(`Proto Dependency fieldType is not 'string'/'string[]'. Cannot check for EntityDependency for collection '${this.dbDef.dbKey}'.`);

					return this.query.where(query as Clause_Where<Proto['dbType']>, transaction);
				}));
		});

		if (!promises.length)
			return result;

		//All gathered conflicting ids
		let conflictingIds = filterDuplicates(flatArray(await Promise.all(promises)).map(dbObjectToId));
		//The MemKey_DeletedDocs object associated with this transaction
		const ignoredInThisTransaction = MemKey_DeletedDocs.get([]).find(item => item.transaction === transaction);
		if (ignoredInThisTransaction) {
			//The key associated with this collection
			const ignoredForThisCollection: Set<UniqueId> | undefined = ignoredInThisTransaction.deleted[this.dbDef.entityName];
			//Filter out all ids of items which were already deleted in this transaction
			conflictingIds = conflictingIds.filter(id => !ignoredForThisCollection?.has(id));
		}
		result.conflictingIds = conflictingIds;
		return result;
	}

	/**
	 * Executed during the initialization of the module.
	 * The collection reference is set in this method.
	 */
	init() {
		const firestore = ModuleBE_Firebase.createAdminSession(this.config?.projectId).getFirestoreV3();
		this.collection = firestore.getCollection<Proto['dbType']>(this.dbDef, {
			canDeleteItems: this.canDeleteItems.bind(this),
			preWriteProcessing: this._preWriteProcessing.bind(this),
			postWriteProcessing: this._postWriteProcessing.bind(this),
			upgradeInstances: this.upgradeInstances.bind(this),
			manipulateQuery: this.manipulateQuery.bind(this)
		});

		// ############################## API ##############################
		this.runTransaction = this.collection.runTransaction;
		type Callable = {
			[K: string]: ((p: any) => Promise<any> | any) | Callable
		}

		const wrapInTryCatch = <T extends Callable>(input: T, path?: string): T => _keys(input).reduce((acc: any, key: keyof T) => {
			const value = input[key];
			const newPath = path ? `${path}.${String(key)}` : String(key);

			if (typeof value === 'function') {
				acc[key] = (async (...args: any[]) => {
					try {
						return await (value as Function)(...args);
					} catch (e: any) {
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
		}, {} as T);

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

	querySync = async (syncQuery: FirestoreQuery<Proto['dbType']>): Promise<Response_DBSync<Proto['dbType']>> => {
		const items = await this.collection.query.custom(syncQuery);
		const deletedItems = await ModuleBE_SyncManager.queryDeleted(this.config.collectionName, syncQuery as FirestoreQuery<DB_Object>);

		await this.upgradeInstances(items);
		return {toUpdate: items, toDelete: deletedItems};
	};

	private _preWriteProcessing = async (dbItem: Proto['uiType'], transaction?: Transaction, upgrade = true) => {
		await this.preWriteProcessing(dbItem, transaction);
	};

	/**
	 * Override this method to customize the processing that should be done before create, set or update.
	 *
	 * @param transaction - The transaction object.
	 * @param dbInstance - The DB entry for which the uniqueness is being asserted.
	 */
	protected async preWriteProcessing(dbInstance: Proto['uiType'], transaction?: Transaction) {
	}

	private _postWriteProcessing = async (data: PostWriteProcessingData<Proto['dbType']>, transaction?: Transaction) => {
		const now = currentTimeMillis();

		if (data.updated && !(Array.isArray(data.updated) && data.updated.length === 0)) {
			const latestUpdated = Array.isArray(data.updated) ?
				data.updated.reduce((toRet, current) => Math.max(toRet, current.__updated), data.updated[0].__updated) :
				data.updated.__updated;
			await ModuleBE_SyncManager.setLastUpdated(this.config.collectionName, latestUpdated);
		}

		if (data.deleted && !(Array.isArray(data.updated) && data.updated.length === 0)) {
			await ModuleBE_SyncManager.onItemsDeleted(this.config.collectionName, asArray(data.deleted), this.config.uniqueKeys, transaction);
			await ModuleBE_SyncManager.setLastUpdated(this.config.collectionName, now);
		} else if (data.deleted === null)
			// this means the whole collection has been deleted - setting the oldestDeleted to now will trigger a clean sync
			await ModuleBE_SyncManager.setOldestDeleted(this.config.collectionName, now);

		await this.postWriteProcessing(data, transaction);
	};

	/**
	 * Override this method to customize processing that should be done after create, set, update or delete.
	 * @param data
	 */
	protected async postWriteProcessing(data: PostWriteProcessingData<Proto>, transaction?: Transaction) {
	}

	manipulateQuery(query: FirestoreQuery<Proto['dbType']>): FirestoreQuery<Proto['dbType']> {
		return query;
	}

	preUpsertProcessing!: never;

	/**
	 * Override this method to provide actions or assertions to be executed before the deletion happens.
	 * @param transaction - The transaction object
	 * @param dbItems - The DB entry that is going to be deleted.
	 */
	async canDeleteItems(dbItems: Proto['dbType'][], transaction?: Transaction) {
		const dependencies = await this.collectDependencies(dbItems, transaction);
		if (dependencies)
			throw new ApiException<EntityDependencyError>(422, 'entity has dependencies').setErrorBody({
				type: 'has-dependencies',
				data: dependencies
			});
	}

	async collectDependencies(dbInstances: Proto['dbType'][], transaction?: Transaction) {
		const potentialProtoDependencyError = await canDeleteDispatcherV3.dispatchModuleAsync(this.dbDef.dbKey, dbInstances.map(dbObjectToId), transaction);
		const protoDependencies = filterInstances(potentialProtoDependencyError.map(item => (item?.conflictingIds.length || 0) === 0 ? undefined : item));

		const potentialErrors = await canDeleteDispatcherV2.dispatchModuleAsync(this.dbDef.entityName, dbInstances, transaction);
		const dependencies = filterInstances(potentialErrors.map(item => (item?.conflictingIds.length || 0) === 0 ? undefined : item));

		const resultDependencies = [...protoDependencies, ...dependencies];
		return resultDependencies.length > 0 ? resultDependencies : undefined;
	}

	private versionUpgrades: { [K in Proto['versions']]: (items: Proto['versions'][K]) => Promise<void> } = {} as { [K in Proto['versions']]: (items: Proto['versions'][K]) => Promise<void> };

	/**
	 * Upgrades the entity from the given version to the next one (to the same version if the given version is the latest)
	 * @param version - The version we start from
	 * @param processor
	 */
	registerVersionUpgradeProcessor<K extends Proto['versions']['versions'][number]>(version: K, processor: (items: Proto['versions']['types'][K][]) => Promise<void>) {
		this.versionUpgrades[version] = processor;
	}

	/**
	 * Check if the collection has at least one item without the latest version. Version[0] is the latest version.
	 */
	public isCollectionUpToDate = async () => {
		return (await this.query.custom({limit: 1, where: {_v: {$neq: this.dbDef.versions[0]}}})).length === 0;
	};

	upgradeCollection = async () => {
		let docs: DocWrapperV3<Proto>[];
		const itemsCount = this.config.chunksSize;

		const query = {
			limit: {page: 0, itemsCount},
		};

		while ((docs = await this.collection.doc.query(query)).length > 0) {

			// this is old Backward compatible from before the assertion of unique ids where the doc ref is the _id of the doc
			const toDelete = docs.filter(doc => {
				return doc.ref.id !== doc.data!._id;
			});

			const instances = docs.map(d => d.data!);
			this.logWarning(`Upgrading batch(${query.limit.page}) found instances(${instances.length}) ${this.dbDef.entityName}s ....`);
			const instancesToSave: Proto['dbType'][] = await this.upgradeInstances(instances);

			// @ts-ignore
			await this.collection.upgradeInstances(instancesToSave);

			if (toDelete.length > 0) {
				this.logWarning(`Need to delete docs: ${toDelete.length} ${this.dbDef.entityName}s ....`);
				await this.collection.delete.multi.allDocs(toDelete);
			}

			query.limit.page++;
		}
	};

	async upgradeInstances(instances: Proto['dbType'][]) {
		let instancesToSave: Proto['dbType'][] = [];
		for (let i = this.config.versions.length - 1; i >= 0; i--) {
			const version = this.config.versions[i] as Proto['versions'][number];

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
			} else {
				this.logInfo(`Upgrade instances(${instancesToUpgrade.length}): ${versionTransition}`);
				await upgradeProcessor?.(instancesToUpgrade);
				instancesToSave.push(...instancesToUpgrade);
			}

			instancesToSave = filterDuplicates(instancesToSave);
			instancesToUpgrade.forEach(instance => instance._v = nextVersion);
		}

		return instancesToSave;
	}
}