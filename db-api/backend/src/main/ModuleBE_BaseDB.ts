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

import {FirestoreQuery} from '@nu-art/firebase-shared';
import {
	_keys,
	ApiException,
	asArray,
	BadImplementationException,
	batchActionParallel,
	currentTimeMillis,
	DB_Object,
	dbObjectToId,
	DotNotation,
	filterDuplicates,
	filterInstances,
	getDotNotatedValue,
	merge,
	Module,
	UniqueId
} from '@nu-art/ts-common';
import {ModuleBE_Firebase} from '@nu-art/firebase-backend';
import {CollectionActionType, FirestoreCollectionV3} from '@nu-art/firebase-backend/firestore-v3/FirestoreCollectionV3';
import {DocWrapperV3} from '@nu-art/firebase-backend/firestore-v3/DocWrapperV3';
import {Transaction} from 'firebase-admin/firestore';
import {MemKey_DeletedDocs} from '@nu-art/firebase-backend/firestore-v3/consts';
import {
	DBApiBEConfig,
	DBEntityDependencies,
	DBEntityDependencyError,
	dispatch_CollectEntityDependencies,
	EntityDependencyCollection,
	getModuleBEConfig,
	ModuleBE_SyncManager,
	Response_DBSync
} from './storm-stubs.js';
import {CrudTypes, SyncNotifier} from '@nu-art/db-api-shared';
import {BaseDBDefBE, PostWriteProcessingDataShape} from './backend-types.js';
import {CrudClause_Where} from '@nu-art/db-api-shared';

export type BaseDBApiConfig = {
	projectId?: string;
	chunksSize: number;
	syncNotifier?: SyncNotifier;
};

export type DBApiConfig = BaseDBApiConfig & DBApiBEConfig;

const CONST_DefaultWriteChunkSize = 200;

/**
 * An abstract base class used for implementing CRUD operations on a specific collection.
 *
 * Typed by ModuleTypesBE (symmetric to FE ModuleTypes); no Proto in the base.
 */
export abstract class ModuleBE_BaseDB<Types extends CrudTypes, ConfigType = any,
	Config extends ConfigType & DBApiConfig = ConfigType & DBApiConfig>
	extends Module<Config>
	implements EntityDependencyCollection {

	// @ts-ignore
	private readonly ModuleBE_BaseDBV2 = true;

	public collection!: FirestoreCollectionV3<any>;
	public readonly dbDef: BaseDBDefBE;
	public query!: FirestoreCollectionV3<any>['query'];
	public create!: FirestoreCollectionV3<any>['create'];
	public set!: FirestoreCollectionV3<any>['set'];
	public delete!: FirestoreCollectionV3<any>['delete'];
	public doc!: FirestoreCollectionV3<any>['doc'];
	public runTransaction!: FirestoreCollectionV3<any>['runTransaction'];

	protected constructor(dbDef: BaseDBDefBE, appConfig?: BaseDBApiConfig) {
		super();

		const config = getModuleBEConfig(dbDef);

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

	__collectEntityDependencies = async (type: string, itemIds: string[], transaction?: Transaction): Promise<DBEntityDependencies | undefined> => {
		const dependencyDefs = this.dbDef.dependencies ?? {};
		const dependencyDefKeys = _keys(dependencyDefs).filter((key): key is string => dependencyDefs[key].dbKey === type);
		if (!dependencyDefKeys.length)
			return;

		const conflictItemQueries = dependencyDefKeys.reduce((acc, dependencyDefKey) => {
			const dependencyDef = dependencyDefs[dependencyDefKey];
			let whereClause: (ids: UniqueId[]) => CrudClause_Where<Types['dbItem']>;
			switch (dependencyDef.fieldType) {
				case 'string':
					whereClause = ids => ({[dependencyDefKey]: {$in: ids}} as CrudClause_Where<Types['dbItem']>);
					break;
				case 'string[]':
					whereClause = ids => ({[dependencyDefKey]: {$aca: ids}} as CrudClause_Where<Types['dbItem']>);
					break;
				default:
					throw new BadImplementationException(`Dependency fieldType is not 'string'/'string[]'. Cannot check for EntityDependency for collection '${this.dbDef.dbKey}'.`);
			}

			acc.push(batchActionParallel(itemIds, 10, async ids => this.query.unManipulatedQuery({where: whereClause(ids)}, transaction)));
			return acc;
		}, [] as Promise<Types['dbItem'][]>[]);

		if (!conflictItemQueries.length)
			return;

		let conflictingItems = filterInstances((await Promise.all(conflictItemQueries)).flat());
		conflictingItems = filterDuplicates<Types['dbItem']>(conflictingItems, dbObjectToId);
		const ignoredInThisTransaction = MemKey_DeletedDocs.get([]).find(item => item.transaction === transaction);
		if (ignoredInThisTransaction) {
			const ignoredForThisCollection: Set<UniqueId> | undefined = ignoredInThisTransaction.deleted[this.dbDef.dbKey];
			conflictingItems = conflictingItems.filter(object => !ignoredForThisCollection?.has(object._id));
		}
		return {
			dbKey: type,
			dependencyMap: this.mapConflicts(conflictingItems, itemIds, dependencyDefKeys),
		};
	};

	private mapConflicts = (conflictItems: Types['dbItem'][], itemIds: UniqueId[], conflictFields: string[]): DBEntityDependencies['dependencyMap'] => {
		return itemIds.reduce((acc, itemId) => {
			const conflictingItems = conflictItems.filter(item => {
				for (const field of conflictFields) {
					const value = getDotNotatedValue(field as DotNotation<Types['dbItem']>, item);
					if (asArray(value).includes(itemId))
						return true;
				}
				return false;
			});

			if (conflictingItems.length)
				acc[itemId] = {[this.dbDef.dbKey]: conflictingItems.map(dbObjectToId)};

			return acc;
		}, {} as DBEntityDependencies['dependencyMap']);
	};

	/**
	 * Executed during the initialization of the module.
	 * The collection reference is set in this method.
	 */
	init() {
		this.resolveCollection();

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
						(this as any).logError(`Error while calling "${newPath}"`);
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

	protected resolveCollection() {
		const firestore = ModuleBE_Firebase.createAdminSession(this.config?.projectId).getFirestoreV3();
		this.collection = firestore.getCollection(this.dbDef as any, {
			canDeleteItems: this.canDeleteItems.bind(this),
			preWriteProcessing: this._preWriteProcessing.bind(this),
			postWriteProcessing: this._postWriteProcessing.bind(this) as any,
			upgradeInstances: this.upgradeInstances.bind(this),
			manipulateQuery: this.manipulateQuery.bind(this) as any
		});
	}

	querySync = async (syncQuery: FirestoreQuery<Types['dbItem']>): Promise<Response_DBSync<Types['dbItem']>> => {
		const items = await this.collection.query.custom(syncQuery);
		const notifier = this.config.syncNotifier ?? ModuleBE_SyncManager;
		const deletedItems = await notifier.queryDeleted(this.dbDef.dbKey, syncQuery as FirestoreQuery<DB_Object>);

		await this.upgradeInstances(items);
		return {toUpdate: items, toDelete: deletedItems};
	};

	private _preWriteProcessing = async (dbItem: Types['uiItem'], originalDbInstance: Types['dbItem'], transaction?: Transaction, upgrade = true) => {
		await this.preWriteProcessing(dbItem, originalDbInstance, transaction);
	};

	/**
	 * Override this method to customize the processing that should be done before create, set or update.
	 *
	 * @param transaction - The transaction object.
	 * @param dbInstance - The DB entry for which the uniqueness is being asserted.
	 * @param originalDbInstance - The DB instance fetched from remote firestore.
	 */
	protected async preWriteProcessing(dbInstance: Types['uiItem'], originalDbInstance: Types['dbItem'], transaction?: Transaction) {
	}

	private _postWriteProcessing = async (data: PostWriteProcessingDataShape<Types['dbItem']>, actionType: CollectionActionType, transaction?: Transaction) => {
		const now = currentTimeMillis();
		const notifier = this.config.syncNotifier ?? ModuleBE_SyncManager;

		if (data.updated && !(Array.isArray(data.updated) && data.updated.length === 0)) {
			const updated = data.updated;
			const latestUpdated = Array.isArray(updated) ?
				updated.reduce((toRet, current) => Math.max(toRet, current.__updated), updated[0].__updated) :
				updated.__updated;
			await notifier.setLastUpdated(this.dbDef.dbKey, latestUpdated);
		}

		if (data.deleted && !(Array.isArray(data.updated) && data.updated.length === 0)) {
			await notifier.onItemsDeleted(this.dbDef.dbKey, asArray(data.deleted), [...this.config.uniqueKeys], transaction);
			await notifier.setLastUpdated(this.dbDef.dbKey, now);
		} else if (data.deleted === null)
			// this means the whole collection has been deleted - setting the oldestDeleted to now will trigger a clean sync
			await notifier.setOldestDeleted(this.dbDef.dbKey, now);

		await this.postWriteProcessing(data, actionType, transaction);
	};

	/**
	 * Override this method to customize processing that should be done after create, set, update or delete.
	 * @param data
	 * @param actionType create/set/update/delete
	 * @param transaction
	 */
	protected async postWriteProcessing(data: PostWriteProcessingDataShape<Types['dbItem']>, actionType: CollectionActionType, transaction?: Transaction) {
	}

	manipulateQuery(query: FirestoreQuery<any>): FirestoreQuery<any> {
		return query;
	}

	preUpsertProcessing!: never;

	/**
	 * Override this method to provide actions or assertions to be executed before the deletion happens.
	 * @param transaction - The transaction object
	 * @param dbItems - The DB entry that is going to be deleted.
	 */
	async canDeleteItems(dbItems: Types['dbItem'][], transaction?: Transaction) {
		const dependencies = await this.collectDependencies(dbItems, transaction);
		if (dependencies)
			throw new ApiException<DBEntityDependencyError>(422, 'entity has dependencies').setErrorBody({
				type: 'entity-has-dependencies',
				data: dependencies
			});
	}

	async collectDependencies(dbInstances: Types['dbItem'][], transaction?: Transaction): Promise<DBEntityDependencies | undefined> {
		const dependencyResponses = await dispatch_CollectEntityDependencies.dispatchModuleAsync(this.dbDef.dbKey, dbInstances.map(dbObjectToId), transaction);
		const filtered = filterInstances(dependencyResponses);
		if (!filtered.length)
			return undefined;

		const merged = filtered.reduce<DBEntityDependencies>((acc, dependency) => merge(acc, dependency), {dbKey: this.dbDef.dbKey, dependencyMap: {}});
		return _keys(merged.dependencyMap).length ? merged : undefined;
	}

	private versionUpgrades: Record<string, (items: Types['dbItem'][]) => Promise<void>> = {};

	/**
	 * Upgrades the entity from the given version to the next one (to the same version if the given version is the latest)
	 * @param version - The version we start from
	 * @param processor
	 */
	registerVersionUpgradeProcessor(version: string, processor: (items: Types['dbItem'][]) => Promise<void>) {
		this.versionUpgrades[version] = processor;
	}

	/**
	 * Check if the collection has at least one item without the latest version. Version[0] is the latest version.
	 */
	public isCollectionUpToDate = async () => {
		return (await this.query.unManipulatedQuery({
			limit: 1,
			where: {_v: {$neq: this.dbDef.versions[0]}}
		})).length === 0;
	};

	upgradeCollection = async (force = false) => {
		return this.processCollection(async (instances) => {
			const instancesToSave: Types['dbItem'][] = await this.upgradeInstances(instances, force);

			// @ts-ignore
			await this.collection.upgradeInstances(instancesToSave);
		});
	};

	processCollection = async (processInstances: (instances: Types['dbItem'][]) => Promise<void>) => {
		let docs: DocWrapperV3<any>[];
		const itemsCount = this.config.chunksSize;

		const query = {
			limit: {page: 0, itemsCount},
		};

		while ((docs = await this.collection.doc.unManipulatedQuery(query)).length > 0) {

			// this is old Backward compatible from before the assertion of unique ids where the doc ref is the _id of the doc
			const toDelete = docs.filter(doc => {
				return doc.ref.id !== doc.data!._id;
			});

			const instances = docs.map(d => d.data!);
			(this as any).logWarning(`Upgrading batch(${query.limit.page}) found instances(${instances.length}) for entity: "${this.dbDef.entityName}" ....`);
			await processInstances(instances);

			if (toDelete.length > 0) {
				(this as any).logWarning(`Need to delete docs: ${toDelete.length} ${this.dbDef.entityName}s ....`);
				await this.collection.delete.multi.allDocs(toDelete);
			}

			query.limit.page++;
		}
	};

	async upgradeInstances(instances: Types['dbItem'][], force = false) {
		let instancesToSave: Types['dbItem'][] = [];
		for (let i = this.config.versions.length - 1; i >= 0; i--) {
			const version = this.config.versions[i];

			const instancesToUpgrade = instances.filter(instance => instance._v === version);
			const nextVersion = this.config.versions[i - 1] ?? version;
			const versionTransition = `${version} => ${nextVersion}`;
			if (instancesToUpgrade.length === 0) {
				(this as any).logVerbose(`No instances to upgrade from ${versionTransition}`);
				continue;
			}

			const upgradeProcessor = this.versionUpgrades[version];
			if (!upgradeProcessor) {
				(this as any).logVerbose(`Will not update ${instancesToUpgrade.length} instances of version ${versionTransition}`);
				(this as any).logVerbose(`No upgrade processor for: ${versionTransition}`);
			} else {
				(this as any).logVerbose(`Upgrade instances(${instancesToUpgrade.length}): ${versionTransition}`);
				await upgradeProcessor?.(instancesToUpgrade);
				instancesToSave.push(...instancesToUpgrade);
			}

			instancesToSave = filterDuplicates(instancesToSave);
			instancesToUpgrade.forEach(instance => instance._v = nextVersion);
		}

		return force ? instances : instancesToSave;
	}
}