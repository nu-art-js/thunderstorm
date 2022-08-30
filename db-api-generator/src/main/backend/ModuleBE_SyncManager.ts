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

import {FirestoreQuery} from '@nu-art/firebase';
import {DatabaseWrapperBE, ModuleBE_Firebase, FirebaseRef, FirestoreCollection, FirestoreTransaction} from '@nu-art/firebase/backend';
import {ApiModule, ApiServerRouter, createQueryServerApi, ExpressRequest, OnModuleCleanup} from '@nu-art/thunderstorm/backend';
import {_keys, currentTimeMillis, DB_Object, filterDuplicates, LogLevel, Module, TypedMap} from '@nu-art/ts-common';
import {ApiDef_SyncManager, ApiStruct_SyncManager, DBSyncData} from '../shared';
import {BaseDB_ModuleBE} from './BaseDB_ModuleBE';


type LastUpdated = { lastUpdated: number, oldestDeleted?: number };
type Type_SyncData = TypedMap<LastUpdated>
type DeletedDBItem = DB_Object & { __collectionName: string }
type Config = {
	retainDeletedCount: number
}

export class ModuleBE_SyncManager_Class
	extends Module<Config>
	implements ApiServerRouter<ApiStruct_SyncManager>, ApiModule, OnModuleCleanup {

	readonly v1;
	public collection!: FirestoreCollection<DeletedDBItem>;

	private database!: DatabaseWrapperBE;
	private dbModules!: BaseDB_ModuleBE<DB_Object>[];
	private syncData!: FirebaseRef<Type_SyncData>;
	private deletedCount!: FirebaseRef<number>;

	constructor() {
		super();
		this.setMinLevel(LogLevel.Debug);
		this.v1 = {
			checkSync: createQueryServerApi(ApiDef_SyncManager.v1.checkSync, this.fetchDBSyncData)
		};
	}

	private prepareItemToDelete = (collectionName: string, item: DB_Object, uniqueKeys: string[] = ['_id']): DeletedDBItem => {
		const {_id, __updated, __created, _v} = item;
		const deletedItem: DeletedDBItem = {_id, __updated, __created, _v, __collectionName: collectionName};
		uniqueKeys.forEach(key => {
			// @ts-ignore
			deletedItem[key] = item[key];
		});
		return deletedItem;
	};

	async onItemsDeleted(collectionName: string, items: DB_Object[], uniqueKeys: string[] = ['_id'], transaction: FirestoreTransaction) {
		const toInsert = items.map(item => this.prepareItemToDelete(collectionName, item, uniqueKeys));
		const now = currentTimeMillis();
		toInsert.forEach(item => item.__updated = now);
		await transaction.insertAll(this.collection, toInsert);
		let deletedCount = await this.deletedCount.get(0);
		deletedCount += items.length;
		await this.deletedCount.set(deletedCount);
	}

	queryDeleted(collectionName: string, query: FirestoreQuery<DB_Object>, transaction: FirestoreTransaction): Promise<DeletedDBItem[]> {
		const finalQuery: FirestoreQuery<DeletedDBItem> = {...query, where: {...query.where, __collectionName: collectionName}};
		return transaction.query(this.collection, finalQuery);
	}

	__onCleanupInvoked = async () => {
		if (!this.config.retainDeletedCount)
			return this.logWarning('Will not run cleanup of deleted values:\n  No "retainDeletedCount" was specified in config..');

		let deletedCount = await this.deletedCount.get();
		if (deletedCount === undefined) {
			deletedCount = (await this.collection.query({where: {}})).length;
			await this.deletedCount.set(deletedCount);
		}

		const toDeleteCount = deletedCount - this.config.retainDeletedCount;
		if (toDeleteCount <= 0)
			return;

		this.logDebug('Docs to delete', deletedCount);
		this.logDebug('Docs to retain', this.config.retainDeletedCount);

		const deleted = await this.collection.delete({limit: toDeleteCount, orderBy: [{key: '__updated', order: 'asc'}]});
		let newDeletedCount = deletedCount - deleted.length;
		if (deleted.length !== toDeleteCount) {
			this.logError(`Expected to delete ${toDeleteCount} but actually deleted ${deleted.length}`);
			newDeletedCount = (await this.collection.query({where: {}})).length;
		}

		await this.deletedCount.set(newDeletedCount);
		const map = deleted.map(item => item.__collectionName);
		const keys = filterDuplicates(map);

		await Promise.all(keys.map(key => {
			const newestDeletedItem = deleted.find(deletedItem => deletedItem.__collectionName === key)!;
			this.logDebug(`setting oldest deleted timestamp ${key} = ${newestDeletedItem.__updated}`);
			return this.setOldestDeleted(key, newestDeletedItem.__updated);
		}));
	};

	useRoutes() {
		return this.v1;
	}

	init() {
		const firestore = ModuleBE_Firebase.createAdminSession().getFirestore();
		this.collection = firestore.getCollection<DeletedDBItem>('__deleted__docs');

		this.dbModules = this.manager.filterModules(module => module instanceof BaseDB_ModuleBE);
		this.database = ModuleBE_Firebase.createAdminSession().getDatabase();
		this.syncData = this.database.ref<Type_SyncData>(`/state/${this.getName()}/syncData`);
		this.deletedCount = this.database.ref<number>(`/state/${this.getName()}/deletedCount`);
	}

	private fetchDBSyncData = async (_: undefined, request: ExpressRequest) => {
		const fbSyncData = await this.syncData.get({});
		const missingModules = this.dbModules.filter(dbModule => !fbSyncData[dbModule.getCollectionName()]);
		if (missingModules.length) {
			this.logWarning(`Syncing missing modules: `, missingModules.map(module => module.getCollectionName()));

			const query: FirestoreQuery<DB_Object> = {limit: 1, orderBy: [{key: '__updated', order: 'asc'}]};
			const newestItems = (await Promise.all(missingModules.map(missingModule => missingModule.query(query))));
			newestItems.forEach((item, index) => fbSyncData[missingModules[index].getCollectionName()] = {lastUpdated: item[0]?.__updated || 0});

			await this.syncData.set(fbSyncData);
		}

		const syncData = _keys(fbSyncData).reduce<DBSyncData[]>((response, dbName) => {
			response.push({name: String(dbName), ...fbSyncData[dbName]});
			return response;
		}, []);
		return {
			syncData
		};
	};

	async setLastUpdated(collectionName: string, lastUpdated: number) {
		return this.database.patch<LastUpdated>(`/state/${this.getName()}/syncData/${collectionName}`, {lastUpdated});
	}

	async setOldestDeleted(collectionName: string, oldestDeleted: number) {
		return this.database.patch<LastUpdated>(`/state/${this.getName()}/syncData/${collectionName}`, {oldestDeleted});
	}
}

export const ModuleBE_SyncManager = new ModuleBE_SyncManager_Class();

