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

import {_EmptyQuery, FirestoreQuery} from '@nu-art/firebase';
import {DatabaseWrapperBE, FirebaseRef, ModuleBE_Firebase} from '@nu-art/firebase/backend';
import {
	_keys,
	currentTimeMillis,
	DB_Object,
	DBDef,
	filterDuplicates,
	LogLevel,
	Module,
	PreDB,
	tsValidateMustExist,
	TypedMap,
	UniqueId
} from '@nu-art/ts-common';
import {FirestoreCollectionV2} from '@nu-art/firebase/backend/firestore-v2/FirestoreCollectionV2';
import {firestore} from 'firebase-admin';
import {OnModuleCleanupV2} from '../backup/ModuleBE_v2_BackupScheduler';
import {createQueryServerApi} from '../../core/typed-api';
import {ApiDef_SyncManagerV2, DBSyncData} from '../../../shared';
import {addRoutes} from '../ModuleBE_APIs';
import Transaction = firestore.Transaction;


type LastUpdated = { lastUpdated: number, oldestDeleted?: number };
type Type_SyncData = TypedMap<LastUpdated>
type DeletedDBItem = DB_Object & { __collectionName: string, __docId: UniqueId }
type Config = {
	retainDeletedCount: number
}

/**
 * # ModuleBE_SyncManager
 *
 * ## <ins>Description:</ins>
 * This module manages all the {@link BaseDB_Module} updates and deleted items in order to allow incremental sync of items with clients
 *
 * ## <ins>Config:</ins>
 *
 * ```json
 * "ModuleBE_SyncManager" : {
 *   	retainDeletedCount: 100
 * }
 * ```
 */
export class ModuleBE_v2_SyncManager_Class
	extends Module<Config>
	implements OnModuleCleanupV2 {

	public collection!: FirestoreCollectionV2<DeletedDBItem>;

	private database!: DatabaseWrapperBE;
	private dbModules!: any;
	private syncData!: FirebaseRef<Type_SyncData>;
	private deletedCount!: FirebaseRef<number>;
	public checkSyncApi;

	constructor() {
		super();
		this.setMinLevel(LogLevel.Debug);
		this.checkSyncApi = createQueryServerApi(ApiDef_SyncManagerV2.v1.checkSync, this.fetchDBSyncData);

		this.setDefaultConfig({retainDeletedCount: 1000});
	}

	init() {
		const firestore = ModuleBE_Firebase.createAdminSession().getFirestoreV2();
		this.collection = firestore.getCollection<DeletedDBItem>(DBDef_DeletedItems);

		this.dbModules = this.manager.filterModules(module => ((module as unknown as { ModuleBE_BaseDBV2: boolean }).ModuleBE_BaseDBV2));
		this.database = ModuleBE_Firebase.createAdminSession().getDatabase();
		this.syncData = this.database.ref<Type_SyncData>(`/state/${this.getName()}/syncData`);
		this.deletedCount = this.database.ref<number>(`/state/${this.getName()}/deletedCount`);
		addRoutes([this.checkSyncApi]);
	}

	private prepareItemToDelete = (collectionName: string, item: DB_Object, uniqueKeys: string[] = ['_id']): PreDB<DeletedDBItem> => {
		const {_id, __updated, __created, _v} = item;
		const deletedItem: PreDB<DeletedDBItem> = {__docId: _id, __updated, __created, _v, __collectionName: collectionName};
		uniqueKeys.forEach(key => {
			// @ts-ignore
			deletedItem[key] = item[key] || '';
		});
		return deletedItem;
	};

	async onItemsDeleted(collectionName: string, items: DB_Object[], uniqueKeys: string[] = ['_id'], transaction?: Transaction) {
		const toInsert = items.map(item => this.prepareItemToDelete(collectionName, item, uniqueKeys));
		const now = currentTimeMillis();
		toInsert.forEach(item => item.__updated = now);
		await this.collection.create.all(toInsert, transaction);
		let deletedCount = await this.deletedCount.get(0);
		deletedCount += items.length;
		await this.deletedCount.set(deletedCount);
	}

	async queryDeleted(collectionName: string, query: FirestoreQuery<DB_Object>): Promise<DeletedDBItem[]> {
		const finalQuery: FirestoreQuery<DeletedDBItem> = {
			...query,
			where: {...query.where, __collectionName: collectionName}
		};

		const deletedItems = await this.collection.query.custom(finalQuery);
		deletedItems.forEach(_item => _item._id = _item.__docId || _item._id);
		return deletedItems;
	}

	__onCleanupInvokedV2 = async () => {
		if (!this.config.retainDeletedCount)
			return this.logWarning('Will not run cleanup of deleted values:\n  No "retainDeletedCount" was specified in config..');

		let deletedCount = await this.deletedCount.get();
		if (deletedCount === undefined) {
			deletedCount = (await this.collection.query.custom(_EmptyQuery)).length;
			await this.deletedCount.set(deletedCount);
		}

		const toDeleteCount = deletedCount - this.config.retainDeletedCount;
		if (toDeleteCount <= 0)
			return;

		this.logDebug('Docs to delete', deletedCount);
		this.logDebug('Docs to retain', this.config.retainDeletedCount);

		const deleted = await this.collection.delete.query({
			limit: toDeleteCount,
			orderBy: [{key: '__updated', order: 'asc'}]
		});
		let newDeletedCount = deletedCount - deleted.length;
		if (deleted.length !== toDeleteCount) {
			this.logError(`Expected to delete ${toDeleteCount} but actually deleted ${deleted.length}`);
			newDeletedCount = (await this.collection.query.custom(_EmptyQuery)).length;
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

	private fetchDBSyncData = async (_: undefined) => {
		const fbSyncData = await this.syncData.get({});
		// @ts-ignore
		const missingModules = this.dbModules.filter(dbModule => !fbSyncData[dbModule.getCollectionName()]);
		if (missingModules.length) {
			// @ts-ignore
			this.logWarning(`Syncing missing modules: `, missingModules.map(module => module.getCollectionName()));

			const query: FirestoreQuery<DB_Object> = {limit: 1, orderBy: [{key: '__updated', order: 'asc'}]};
			// @ts-ignore
			const newestItems = (await Promise.all(missingModules.map(async missingModule => {
				try {
					return await missingModule.query.custom(query);
				} catch (e) {
					return [];
				}
			})));
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

export const DBDef_DeletedItems: DBDef<DeletedDBItem> = {
	validator: tsValidateMustExist,
	dbName: '__deleted__docs',
	entityName: 'DeletedDoc',
	versions: ['1.0.0'],
};

export const ModuleBE_v2_SyncManager = new ModuleBE_v2_SyncManager_Class();

