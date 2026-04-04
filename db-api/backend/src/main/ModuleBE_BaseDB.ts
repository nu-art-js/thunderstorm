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
	dbObjectToId,
	DotNotation,
	filterDuplicates,
	filterInstances,
	getDotNotatedValue,
	merge,
	Module, RuntimeModules, TS_Object,
	UniqueId
} from '@nu-art/ts-common';
import {ModuleBE_Firebase} from '@nu-art/firebase-backend';
import {CollectionActionType, FirestoreCollection} from '@nu-art/firebase-backend/firestore/FirestoreCollection';
import {DocWrapper} from '@nu-art/firebase-backend/firestore/DocWrapper';
import {Transaction} from 'firebase-admin/firestore';
import {MemKey_DeletedDocs} from '@nu-art/firebase-backend/firestore/consts';
import {
	DBApiBEConfig,
	DBEntityDependencies,
	DBEntityDependencyError,
	dispatch_CollectEntityDependencies,
	EntityDependencyCollection,
	getModuleBEConfig
} from './storm-stubs.js';
import {CrudClause_Where, DB_Prototype} from '@nu-art/db-api-shared';
import {BaseDBDefBE, PostWriteInterceptor, PostWriteProcessingDataShape, PreDeleteInterceptor, PreWriteInterceptor, QueryInterceptor} from './backend-types.js';

export type BaseDBApiConfig = {
	projectId?: string;
	chunksSize?: number;
};

export type DBApiConfig = BaseDBApiConfig & DBApiBEConfig;


const CONST_DefaultWriteChunkSize = 200;

/**
 * An abstract base class used for implementing CRUD operations on a specific collection.
 *
 * Typed by ModuleTypesBE (symmetric to FE ModuleTypes); no Proto in the base.
 */
export abstract class ModuleBE_BaseDB<Database extends DB_Prototype, Config extends TS_Object = any>
	extends Module<Config & DBApiConfig>
	implements EntityDependencyCollection {

	// @ts-ignore
	private readonly ModuleBE_BaseDBV2 = true;

	public collection!: FirestoreCollection<Database>;
	public readonly dbDef: BaseDBDefBE;
	public query!: FirestoreCollection<Database>['query'];
	public create!: FirestoreCollection<Database>['create'];
	public set!: FirestoreCollection<Database>['set'];
	public delete!: FirestoreCollection<Database>['delete'];
	public doc!: FirestoreCollection<Database>['doc'];
	public runTransaction!: FirestoreCollection<Database>['runTransaction'];

	private readonly preWriteInterceptors: PreWriteInterceptor<Database>[] = [];
	private readonly postWriteInterceptors: PostWriteInterceptor<Database>[] = [];
	private readonly queryInterceptors: QueryInterceptor<Database>[] = [];
	private readonly preDeleteInterceptors: PreDeleteInterceptor<Database>[] = [];

	protected constructor(dbDef: BaseDBDefBE, appConfig?: BaseDBApiConfig) {
		super();
		this.addToClassStack(ModuleBE_BaseDB);

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

	registerPreWriteInterceptor(fn: PreWriteInterceptor<Database>): void {
		this.preWriteInterceptors.push(fn);
	}

	registerQueryInterceptor(fn: QueryInterceptor<Database>): void {
		this.queryInterceptors.push(fn);
	}

	registerPostWriteInterceptor(fn: PostWriteInterceptor<Database>): void {
		this.postWriteInterceptors.push(fn);
	}

	registerPreDeleteInterceptor(fn: PreDeleteInterceptor<Database>): void {
		this.preDeleteInterceptors.push(fn);
	}

	__collectEntityDependencies = async (type: string, itemIds: string[], transaction?: Transaction): Promise<DBEntityDependencies | undefined> => {
		const dependencyDefs = this.dbDef.dependencies ?? {};
		const dependencyDefKeys = _keys(dependencyDefs).filter((key): key is string => dependencyDefs[key].dbKey === type);
		if (!dependencyDefKeys.length)
			return;

		const conflictItemQueries = dependencyDefKeys.reduce((acc, dependencyDefKey) => {
			const dependencyDef = dependencyDefs[dependencyDefKey];
			let whereClause: (ids: UniqueId[]) => CrudClause_Where<Database['dbType']>;
			switch (dependencyDef.fieldType) {
				case 'string':
					whereClause = ids => ({[dependencyDefKey]: {$in: ids}} as CrudClause_Where<Database['dbType']>);
					break;
				case 'string[]':
					whereClause = ids => ({[dependencyDefKey]: {$aca: ids}} as CrudClause_Where<Database['dbType']>);
					break;
				default:
					throw new BadImplementationException(`Dependency fieldType is not 'string'/'string[]'. Cannot check for EntityDependency for collection '${this.dbDef.dbKey}'.`);
			}

			acc.push(batchActionParallel(itemIds, 10, async ids => this.query.unManipulatedQuery({where: whereClause(ids)}, transaction)));
			return acc;
		}, [] as Promise<Database['dbType'][]>[]);

		if (!conflictItemQueries.length)
			return;

		let conflictingItems = filterInstances((await Promise.all(conflictItemQueries)).flat());
		conflictingItems = filterDuplicates<Database['dbType']>(conflictingItems, dbObjectToId);
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

	private mapConflicts = (conflictItems: Database['dbType'][], itemIds: UniqueId[], conflictFields: string[]): DBEntityDependencies['dependencyMap'] => {
		return itemIds.reduce((acc, itemId) => {
			const conflictingItems = conflictItems.filter(item => {
				for (const field of conflictFields) {
					const value = getDotNotatedValue(field as DotNotation<Database['dbType']>, item);
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
		const firestore = ModuleBE_Firebase.createAdminSession(this.config?.projectId).getFirestore();
		this.collection = firestore.getCollection(this.dbDef as any, {
			canDeleteItems: this.canDeleteItems.bind(this),
			preWriteProcessing: this._preWriteProcessing.bind(this),
			postWriteProcessing: this._postWriteProcessing.bind(this) as any,
			upgradeInstances: this.upgradeInstances.bind(this),
			manipulateQuery: this._manipulateQuery.bind(this) as any
		});
	}

	private _preWriteProcessing = async (dbItem: Database['uiType'], originalDbInstance: Database['dbType'], transaction?: Transaction, upgrade = true) => {
		for (const interceptor of this.preWriteInterceptors)
			await interceptor(dbItem, originalDbInstance, transaction);

		await this.preWriteProcessing(dbItem, originalDbInstance, transaction);
	};

	/**
	 * Override this method to customize the processing that should be done before create, set or update.
	 *
	 * @param transaction - The transaction object.
	 * @param dbInstance - The DB entry for which the uniqueness is being asserted.
	 * @param originalDbInstance - The DB instance fetched from remote firestore.
	 */
	protected async preWriteProcessing(dbInstance: Database['uiType'], originalDbInstance: Database['dbType'], transaction?: Transaction) {
	}

	private _postWriteProcessing = async (data: PostWriteProcessingDataShape<Database['dbType']>, actionType: CollectionActionType, transaction?: Transaction) => {
		await this.postWriteProcessing(data, actionType, transaction);

		for (const interceptor of this.postWriteInterceptors)
			await interceptor(data, actionType, transaction);
	};

	/**
	 * Override this method to customize processing that should be done after create, set, update or delete.
	 * @param data
	 * @param actionType create/set/update/delete
	 * @param transaction
	 */
	protected async postWriteProcessing(data: PostWriteProcessingDataShape<Database['dbType']>, actionType: CollectionActionType, transaction?: Transaction) {
	}

	private _manipulateQuery = (query: FirestoreQuery<Database['dbType']>): FirestoreQuery<Database['dbType']> => {
		let result = query;
		for (const interceptor of this.queryInterceptors)
			result = interceptor(result);

		return this.manipulateQuery(result);
	};

	manipulateQuery(query: FirestoreQuery<any>): FirestoreQuery<any> {
		return query;
	}

	preUpsertProcessing!: never;

	/**
	 * Override this method to provide actions or assertions to be executed before the deletion happens.
	 * @param transaction - The transaction object
	 * @param dbItems - The DB entry that is going to be deleted.
	 */
	async canDeleteItems(dbItems: Database['dbType'][], transaction?: Transaction) {
		for (const interceptor of this.preDeleteInterceptors)
			await interceptor(dbItems, transaction);

		const dependencies = await this.collectDependencies(dbItems, transaction);
		if (dependencies)
			throw new ApiException<DBEntityDependencyError>(422, 'entity has dependencies').setErrorBody({
				type: 'entity-has-dependencies',
				data: dependencies
			});
	}

	async collectDependencies(dbInstances: Database['dbType'][], transaction?: Transaction): Promise<DBEntityDependencies | undefined> {
		const dependencyResponses = await dispatch_CollectEntityDependencies.dispatchModuleAsync(this.dbDef.dbKey, dbInstances.map(dbObjectToId), transaction);
		const filtered = filterInstances(dependencyResponses);
		if (!filtered.length)
			return undefined;

		const merged = filtered.reduce<DBEntityDependencies>((acc, dependency) => merge(acc, dependency), {dbKey: this.dbDef.dbKey, dependencyMap: {}});
		return _keys(merged.dependencyMap).length ? merged : undefined;
	}

	private versionUpgrades: Record<string, (items: Database['dbType'][]) => Promise<void>> = {};

	/**
	 * Upgrades the entity from the given version to the next one (to the same version if the given version is the latest)
	 * @param version - The version we start from
	 * @param processor
	 */
	registerVersionUpgradeProcessor(version: string, processor: (items: Database['dbType'][]) => Promise<void>) {
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
			const instancesToSave: Database['dbType'][] = await this.upgradeInstances(instances, force);

			// @ts-ignore
			await this.collection.upgradeInstances(instancesToSave);
		});
	};

	processCollection = async (processInstances: (instances: Database['dbType'][]) => Promise<void>) => {
		let docs: DocWrapper<any>[];
		const itemsCount = this.config.chunksSize ?? CONST_DefaultWriteChunkSize;

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

	async upgradeInstances(instances: Database['dbType'][], force = false) {
		let instancesToSave: Database['dbType'][] = [];
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

export const RuntimeBE_ModulesDB = () => RuntimeModules().all
	.filter((m) => m.isInstanceOf(ModuleBE_BaseDB))
	.map(m => m as unknown as ModuleBE_BaseDB<any>);