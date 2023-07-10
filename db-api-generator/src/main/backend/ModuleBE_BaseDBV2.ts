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

import {DB_EntityDependency, FirestoreQuery,} from '@nu-art/firebase';
import {ApiException, DB_Object, DBDef, Default_UniqueKey, filterInstances, Module, PreDB} from '@nu-art/ts-common';
import {ModuleBE_Firebase,} from '@nu-art/firebase/backend';
import {DBApiBEConfig, getModuleBEConfig} from './db-def';
import {_EmptyQuery, Response_DBSync} from '../shared';
import {FirestoreCollectionV2} from '@nu-art/firebase/backend/firestore-v2/FirestoreCollectionV2';
import {firestore} from 'firebase-admin';
import {canDeleteDispatcherV2} from '@nu-art/firebase/backend/firestore-v2/consts';
import {OnFirestoreBackupSchedulerActV2} from '@nu-art/thunderstorm/backend/modules/backup/FirestoreBackupSchedulerV2';
import {FirestoreBackupDetailsV2} from '@nu-art/thunderstorm/backend/modules/backup/ModuleBE_BackupV2';
import {ModuleBE_SyncManagerV2} from './ModuleBE_SyncManagerV2';
import Transaction = firestore.Transaction;


export type BaseDBApiConfig = {
	projectId?: string,
	maxChunkSize: number
}

export type DBApiConfig<Type extends DB_Object> = BaseDBApiConfig & DBApiBEConfig<Type>

/**
 * An abstract base class used for implementing CRUD operations on a specific collection.
 *
 * By default, it exposes API endpoints for creating, deleting, updating, querying and querying for unique document.
 */
export abstract class ModuleBE_BaseDBV2<Type extends DB_Object, ConfigType extends DBApiConfig<Type> = DBApiConfig<Type>, Ks extends keyof PreDB<Type> = Default_UniqueKey>
	extends Module<ConfigType>
	implements OnFirestoreBackupSchedulerActV2 {
	// private static DeleteHardLimit = 250;
	public collection!: FirestoreCollectionV2<Type>;
	public dbDef: DBDef<Type, any>;
	public query!: FirestoreCollectionV2<Type>['query'];
	public create!: FirestoreCollectionV2<Type>['create'];
	public set!: FirestoreCollectionV2<Type>['set'];
	public update!: FirestoreCollectionV2<Type>['update'];
	public delete!: FirestoreCollectionV2<Type>['delete'];
	public runTransaction!: FirestoreCollectionV2<Type>['runTransaction'];

	protected constructor(dbDef: DBDef<Type, any>, appConfig?: BaseDBApiConfig) {
		super();

		const config = getModuleBEConfig(dbDef);

		const preConfig = {...config, ...appConfig};
		// @ts-ignore
		this.setDefaultConfig(preConfig);
		this.dbDef = dbDef;
		this.canDeleteItems.bind(this);
		this._prepareItemForDB.bind(this);
		this.manipulateQuery.bind(this);
	}

	/**
	 * Executed during the initialization of the module.
	 * The collection reference is set in this method.
	 */
	init() {
		const firestore = ModuleBE_Firebase.createAdminSession(this.config?.projectId).getFirestoreV2();
		this.collection = firestore.getCollection<Type>(this.dbDef, {
			canDeleteItems: this.canDeleteItems,
			prepareItemForDB: this._prepareItemForDB,
			manipulateQuery: this.manipulateQuery
		});

		// ############################## API ##############################
		this.runTransaction = this.collection.runTransaction;
		this.query = this.collection.query;
		this.create = this.collection.create;
		this.set = this.collection.set;
		this.update = this.collection.update;
		this.delete = this.collection.delete;
	}

	getCollectionName() {
		return this.config.collectionName;
	}

	getItemName() {
		return this.config.itemName;
	}

	__onFirestoreBackupSchedulerActV2(): FirestoreBackupDetailsV2<Type>[] {
		return [{
			query: this.resolveBackupQuery(),
			queryFunction: this.collection.query.custom,
			moduleKey: this.config.collectionName,
			version: this.config.versions[0]
		}];
	}

	protected resolveBackupQuery(): FirestoreQuery<Type> {
		return _EmptyQuery;
	}

	querySync = async (syncQuery: FirestoreQuery<Type>): Promise<Response_DBSync<Type>> => {
		const items = await this.collection.query.custom(syncQuery);
		const deletedItems = await ModuleBE_SyncManagerV2.queryDeleted(this.config.collectionName, syncQuery as FirestoreQuery<DB_Object>);

		await this.upgradeInstances(items);
		return {toUpdate: items, toDelete: deletedItems};
	};

	/*
	 * TO BE MOVED ABOVE THIS COMMENT
	 *
	 *
	 *  -- Everything under this comment should be revised and move up --
	 *
	 *
	 * TO BE MOVED ABOVE THIS COMMENT
	 */

	private _prepareItemForDB = async (dbItem: PreDB<Type>, transaction?: Transaction) => {
		await this.upgradeInstances([dbItem]);
		await this.prepareItemForDB(dbItem, transaction);
	};

	manipulateQuery(query: FirestoreQuery<Type>): FirestoreQuery<Type> {
		return query;
	}

	/**
	 * Override this method to customize the assertions that should be done before the insertion of the document to the DB.
	 *
	 * @param transaction - The transaction object.
	 * @param dbInstance - The DB entry for which the uniqueness is being asserted.
	 * @param request
	 */
	protected async prepareItemForDB(dbInstance: PreDB<Type>, transaction?: Transaction) {
	}

	preUpsertProcessing(doNotCompileWithThisFunction: number) {
		//todo Deprecated, turn all into prepareItemForDB
	}

	upgradeInstances = async (dbInstances: PreDB<Type>[]) => {
		await Promise.all(dbInstances.map(async dbInstance => {
			const instanceVersion = dbInstance._v;
			const currentVersion = this.config.versions[0];

			if (instanceVersion !== undefined && instanceVersion !== currentVersion)
				try {
					await this.upgradeItem(dbInstance, currentVersion);
				} catch (e: any) {
					throw new ApiException(500, `Error while upgrading db item "${this.config.itemName}"(${dbInstance._id}): ${instanceVersion} => ${currentVersion}`,
						e.message);
				}
			dbInstance._v = currentVersion;
		}));
	};

	protected async upgradeItem(dbItem: PreDB<Type>, toVersion: string): Promise<void> {
	}

	async promoteCollection() {
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

				const itemsToSyncQuery: FirestoreQuery<DB_Object> = {
					where: {
						_v: {$neq: this.config.versions[0]},
					},
					limit: {page, itemsCount}
				};

				const items = await this.collection.query.custom(itemsToSyncQuery as FirestoreQuery<Type>);
				this.logInfo(`Page: ${page} Found: ${items.length} - first: ${items?.[0]?.__updated}   last: ${items?.[items.length - 1]?.__updated}`);
				await this.collection.set.all(items);

				if (items.length < itemsCount)
					break;

				page++;
			} catch (e) {
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
	async canDeleteItems(dbItems: Type[], transaction?: Transaction) {
		const dependencies = await this.collectDependencies(dbItems, transaction);
		if (dependencies)
			throw new ApiException<DB_EntityDependency<any>[]>(422, 'entity has dependencies').setErrorBody({
				type: 'has-dependencies',
				body: dependencies
			});
	}

	async collectDependencies(dbInstances: Type[], transaction?: Transaction) {
		const potentialErrors = await canDeleteDispatcherV2.dispatchModuleAsync(this.dbDef.entityName, dbInstances, transaction);
		const dependencies = filterInstances(potentialErrors.map(item => (item?.conflictingIds.length || 0) === 0 ? undefined : item));
		return dependencies.length > 0 ? dependencies : undefined;
	}

	deleteCollection = async () => {
		this.logWarning(`Called delete collection on ${this.collection.name}!`);
		await this.collection.deleteCollection();
		this.logWarning(`Deleted collection ${this.collection.name}.`);
	};
}