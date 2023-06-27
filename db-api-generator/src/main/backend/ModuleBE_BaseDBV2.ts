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

import {Clause_Where, FirestoreQuery,} from '@nu-art/firebase';
import {__stringify, _keys, ApiException, Day, DB_Object, DBDef, Module, ValidatorTypeResolver} from '@nu-art/ts-common';
import {ExpressRequest, OnFirestoreBackupSchedulerAct} from '@nu-art/thunderstorm/backend';
import {FirestoreInterface, FirestoreTransaction, ModuleBE_Firebase,} from '@nu-art/firebase/backend';
import {DBApiBEConfig, getModuleBEConfig} from './db-def';
import {ModuleBE_SyncManager} from './ModuleBE_SyncManager';
import {_EmptyQuery, Response_DBSync} from '../shared';
import {FirestoreBackupDetails} from '@nu-art/thunderstorm/backend/modules/backup/ModuleBE_Backup';
import {FirestoreCollectionV2} from "@nu-art/firebase/backend/firestore-v2/FirestoreCollectionV2";


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
export abstract class ModuleBE_BaseDB<Type extends DB_Object, ConfigType extends DBApiConfig<Type> = DBApiConfig<Type>, Ks extends keyof Type = '_id'>
	extends Module<ConfigType>
	implements OnFirestoreBackupSchedulerAct {
	// private static DeleteHardLimit = 250;
	public collection!: FirestoreCollectionV2<Type>;
	readonly dbDef: DBDef<Type, any>;

	protected constructor(dbDef: DBDef<Type, any>, appConfig?: BaseDBApiConfig) {
		super();

		const config = getModuleBEConfig(dbDef);

		const preConfig = {...config, ...appConfig};
		// @ts-ignore
		this.setDefaultConfig(preConfig);
		this.dbDef = dbDef;
	}

	/**
	 * Executed during the initialization of the module.
	 * The collection reference is set in this method.
	 */
	init() {
		const firestore = ModuleBE_Firebase.createAdminSession(this.config?.projectId).getFirestoreV2();
		this.collection = firestore.getCollection<Type>(this.dbDef);
	}

	getCollectionName() {
		return this.config.collectionName;
	}

	getItemName() {
		return this.config.itemName;
	}

	__onFirestoreBackupSchedulerAct(): FirestoreBackupDetails<Type>[] {
		return [{
			backupQuery: this.resolveBackupQuery(),
			collection: this.collection,
			keepInterval: 7 * Day,
			minTimeThreshold: Day,
			moduleKey: this.config.collectionName
		}];
	}

	protected resolveBackupQuery(): FirestoreQuery<Type> {
		return _EmptyQuery;
	}

	async querySync(syncQuery: FirestoreQuery<Type>, request: ExpressRequest): Promise<Response_DBSync<Type>> {
		return this.runInTransaction(async transaction => {
			const items = await transaction.query(this.collection, syncQuery);
			const deletedItems = await ModuleBE_SyncManager.queryDeleted(this.config.collectionName, syncQuery as FirestoreQuery<DB_Object>, transaction);

			await this.upgradeInstances(items);
			return {toUpdate: items, toDelete: deletedItems};
		});
	}

	/*
	 * TO BE MOVED ABOVE THIS COMMENT
	 *
	 *
	 *  -- Everything under this comment should be revised and move up --
	 *
	 *
	 * TO BE MOVED ABOVE THIS COMMENT
	 */

	private async assertExternalQueryUnique(instance: Type, transaction: FirestoreTransaction): Promise<Type> {
		const dbInstance: Type | undefined = await transaction.queryItem(this.collection, instance);
		if (!dbInstance) {
			const uniqueQuery = FirestoreInterface.buildUniqueQuery(this.collection, instance);
			throw new ApiException(404, `Could not find ${this.config.itemName} with unique query '${__stringify(uniqueQuery)}'`);
		}

		return dbInstance;
	}

	/**
	 * Asserts the uniqueness of an instance in two steps:
	 * - Executes `this.preUpsertProcessing`.
	 * - Asserts uniqueness based on the internal filters.
	 *
	 * @param transaction - The transaction object.
	 * @param instance - The document for which the uniqueness assertion will occur.
	 * @param request
	 */
	public async assertUniqueness(instance: Type, transaction?: FirestoreTransaction, request?: ExpressRequest) {
		const uniqueQueries = this.internalFilter(instance);
		if (uniqueQueries.length === 0)
			return;

		const dbInstances: (Type | undefined)[] = await Promise.all(uniqueQueries.map(uniqueQuery => {
			if (transaction)
				return transaction.queryUnique(this.collection, {where: uniqueQuery, limit: 1});

			return this.collection.queryUnique({where: uniqueQuery});
		}));

		for (const idx in dbInstances) {
			const dbInstance = dbInstances[idx];
			// this.logInfo(`keys: ${__stringify(this.config.uniqueKeys)}`)
			// this.logInfo(`pre instance: ${__stringify(dbInstance)}`)
			// this.logInfo(`new instance: ${__stringify(instance)}`)
			if (!dbInstance || !this.config.uniqueKeys.find((key: keyof Type) => dbInstance[key] !== instance[key]))
				continue;

			const query = uniqueQueries[idx];
			const message = _keys(query).reduce((carry, key) => {
				return carry + '\n' + `${String(key)}: ${query[key]}`;
			}, `${this.config.itemName} uniqueness violation. There is already a document with`);

			this.logWarning(message);
			throw new ApiException(422, message);
		}
	}

	/**
	 * Override this method to return a list of "where" queries that dictate uniqueness inside the collection.
	 * Example return value: [{attribute1: item.attribute1, attribute2: item.attribute2}].
	 *
	 * @param item - The DB entry that will be used.
	 */
	protected internalFilter(item: Type): Clause_Where<Type>[] {
		return [];
	}

	private async _preUpsertProcessing(dbInstance: Type, transaction?: FirestoreTransaction, request?: ExpressRequest) {
		await this.upgradeInstances([dbInstance]);
		await this.preUpsertProcessing(dbInstance, transaction, request);
	}

	async upgradeInstances(dbInstances: Type[]) {
		await Promise.all(dbInstances.map(async dbInstance => {
			const instanceVersion = dbInstance._v;
			const currentVersion = this.config.versions[0];

			if (instanceVersion !== undefined && instanceVersion !== currentVersion)
				try {
					await this.upgradeInstance(dbInstance, currentVersion);
				} catch (e: any) {
					throw new ApiException(500, `Error while upgrading db item "${this.config.itemName}"(${dbInstance._id}): ${instanceVersion} => ${currentVersion}`,
						e.message);
				}
			dbInstance._v = currentVersion;
		}));
	}

	protected async upgradeInstance(dbInstance: Type, toVersion: string): Promise<void> {
	}

	/**
	 * Override this method to customize the assertions that should be done before the insertion of the document to the DB.
	 *
	 * @param transaction - The transaction object.
	 * @param dbInstance - The DB entry for which the uniqueness is being asserted.
	 * @param request
	 */
	protected async preUpsertProcessing(dbInstance: Type, transaction?: FirestoreTransaction, request?: ExpressRequest) {
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

				const items = await this.query(itemsToSyncQuery as FirestoreQuery<Type>);
				this.logInfo(`Page: ${page} Found: ${items.length} - first: ${items?.[0]?.__updated}   last: ${items?.[items.length - 1]?.__updated}`);
				await this.upsertAll(items);

				if (items.length < itemsCount)
					break;

				page++;
			} catch (e) {
				break;
			}

			iteration++;
		}
	}
}