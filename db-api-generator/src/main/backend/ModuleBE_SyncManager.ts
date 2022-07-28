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
import {DatabaseWrapper, FirebaseModule, FirestoreCollection, FirestoreTransaction} from '@nu-art/firebase/backend';
import {ApiModule, ApiServerRouter, createQueryServerApi, ExpressRequest} from '@nu-art/thunderstorm/backend';
import {_keys, DB_Object, Module, TypedMap} from '@nu-art/ts-common';
import {ApiDef_SyncManager, ApiStruct_SyncManager, DBSyncData} from '../shared';
import {BaseDB_Module} from './BaseDB_Module';


type LastUpdated = { lastUpdated: number };
type Type_SyncData = TypedMap<LastUpdated>
type DeletedDBItem = DB_Object & { __collectionName: string }

export class ModuleBE_SyncManager_Class
	extends Module
	implements ApiServerRouter<ApiStruct_SyncManager>, ApiModule {

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
		await transaction.insertAll(this.collection, toInsert);
	}

	queryDeleted(collectionName: string, query: FirestoreQuery<DB_Object>, transaction: FirestoreTransaction): Promise<DeletedDBItem[]> {
		const finalQuery: FirestoreQuery<DeletedDBItem> = {...query, where: {...query.where, __collectionName: collectionName}};
		return transaction.query(this.collection, finalQuery);
	}

	readonly v1;
	public collection!: FirestoreCollection<DeletedDBItem>;

	private database!: DatabaseWrapper;
	private dbModules!: BaseDB_Module<DB_Object>[];

	constructor() {
		super();
		this.v1 = {
			checkSync: createQueryServerApi(ApiDef_SyncManager.v1.checkSync, this.fetchDBSyncData)
		};
	}

	useRoutes() {
		return this.v1;
	}

	init() {
		const firestore = FirebaseModule.createAdminSession(this.config?.projectId).getFirestore();
		this.collection = firestore.getCollection<DeletedDBItem>('__deleted__', this.config.uniqueKeys);

		this.database = FirebaseModule.createAdminSession().getDatabase();
		this.dbModules = this.manager.filterModules(module => module instanceof BaseDB_Module);
	}

	private fetchDBSyncData = async (_: undefined, request: ExpressRequest) => {
		const pathToSyncData = `/state/${this.getName()}/syncData`;

		const fbSyncData = await this.database.get<Type_SyncData>(pathToSyncData) || {};
		const missingModules = this.dbModules.filter(dbModule => !fbSyncData[dbModule.getCollectionName()]);
		if (missingModules.length) {
			this.logWarning(`Syncing missing modules: `, missingModules.map(module => module.getCollectionName()));

			const query: FirestoreQuery<DB_Object> = {limit: 1, orderBy: [{key: '__updated', order: 'asc'}]};
			const newestItems = (await Promise.all(missingModules.map(missingModule => missingModule.query(query))));
			newestItems.forEach((item, index) => fbSyncData[missingModules[index].getCollectionName()] = {lastUpdated: item[0]?.__updated || 0});

			await this.database.set<Type_SyncData>(pathToSyncData, fbSyncData);
		}

		const syncData = _keys(fbSyncData).reduce<DBSyncData[]>((response, dbName) => {
			response.push({name: String(dbName), lastUpdated: fbSyncData[dbName].lastUpdated});
			return response;
		}, []);
		return {syncData};
	};

	async setLastUpdated(collectionName: string, lastUpdated: number) {
		return this.database.set<LastUpdated>(`/state/${this.getName()}/syncData/${collectionName}`, {lastUpdated});
	}
}

export const ModuleBE_SyncManager = new ModuleBE_SyncManager_Class();

