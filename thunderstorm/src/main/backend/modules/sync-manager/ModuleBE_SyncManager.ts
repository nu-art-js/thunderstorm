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
	__stringify,
	arrayToMap,
	currentTimeMillis,
	DB_Object,
	exists,
	filterDuplicates,
	LogLevel,
	Module,
	PreDB,
	RuntimeModules,
	Second,
	TypedMap,
	UniqueId
} from '@nu-art/ts-common';
import {firestore} from 'firebase-admin';
import {createBodyServerApi} from '../../core/typed-api';
import {addRoutes} from '../ModuleBE_APIs';
import {ModuleBE_BaseDBV3} from '../db-api-gen/ModuleBE_BaseDBV3';
import {
	DeltaSyncModule,
	FullSyncModule,
	LastUpdated,
	NoNeedToSyncModule,
	Request_SmartSync,
	Response_SmartSync,
	SmartSync_DeltaSync,
	SmartSync_FullSync,
	SmartSync_UpToDateSync,
	SyncDataFirebaseState
} from '../../../shared/sync-manager/types';
import {DBDef_DeletedDoc, DBProto_DeletedDoc, HttpMethod} from '../../../shared';
import {OnSyncEnvCompleted} from '../sync-env/ModuleBE_v2_SyncEnv';
import {OnModuleCleanupV2} from '../../_entity';
import {FirestoreCollectionV3} from '@nu-art/firebase/backend/firestore-v3/FirestoreCollectionV3';
import Transaction = firestore.Transaction;


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
export class ModuleBE_SyncManager_Class
	extends Module<Config>
	implements OnModuleCleanupV2, OnSyncEnvCompleted {

	public collection!: FirestoreCollectionV3<DBProto_DeletedDoc>;

	private database!: DatabaseWrapperBE;
	private dbModules!: (ModuleBE_BaseDBV3<any>)[];
	private syncData!: FirebaseRef<SyncDataFirebaseState>;
	private deletedCount!: FirebaseRef<number>;
	public smartSyncApi;

	constructor() {
		super();
		this.setMinLevel(LogLevel.Debug);
		this.smartSyncApi = createBodyServerApi({
			method: HttpMethod.POST,
			path: 'v3/db-api/smart-sync',
			timeout: 60 * Second
		}, this.calculateSmartSync);

		this.setDefaultConfig({retainDeletedCount: 1000});
	}

	async __onSyncEnvCompleted(env: string, baseUrl: string, requiredHeaders: TypedMap<string>) {
		await this.database.delete(`/state/${this.getName()}/syncData`);
	}

	init() {
		const firestore = ModuleBE_Firebase.createAdminSession().getFirestoreV3();
		this.collection = firestore.getCollection(DBDef_DeletedDoc);

		this.dbModules = RuntimeModules().filter(module => ((module as unknown as {
			ModuleBE_BaseDBV2: boolean
		}).ModuleBE_BaseDBV2));
		this.database = ModuleBE_Firebase.createAdminSession().getDatabase();
		this.syncData = this.database.ref<SyncDataFirebaseState>(`/state/${this.getName()}/syncData`);
		this.deletedCount = this.database.ref<number>(`/state/${this.getName()}/deletedCount`);
		addRoutes([this.smartSyncApi]);
	}

	private calculateSmartSync = async (body: Request_SmartSync): Promise<Response_SmartSync> => {
		const frontendCollectionNames = body.modules.map(item => item.dbKey);
		this.logVerbose(`Modules wanted: ${__stringify(frontendCollectionNames)}`);

		const permissibleModules: (ModuleBE_BaseDBV3<any>)[] = await this.filterModules(this.dbModules.filter(dbModule => frontendCollectionNames.includes(dbModule.dbDef.dbKey)));
		this.logVerbose(`Modules found: ${__stringify(permissibleModules.map(_module => _module.dbDef.dbKey))}`);

		const dbNameToModuleMap = arrayToMap(permissibleModules, (item: (ModuleBE_BaseDBV3<any>)) => item.dbDef.dbKey);
		const syncDataResponse: (NoNeedToSyncModule | DeltaSyncModule | FullSyncModule)[] = [];
		const upToDateSyncData = await this.getOrCreateSyncData(body);

		// For each module, create the response, which says what type of sync it needs: none, delta or full.
		await Promise.all(body.modules.map(async syncRequest => {
			const moduleToCheck = dbNameToModuleMap[syncRequest.dbKey] as (ModuleBE_BaseDBV3<any>);
			if (!moduleToCheck)
				return this.logError(`Calculating collections to sync, failing to find dbKey: ${syncRequest.dbKey}`);

			const remoteSyncData = upToDateSyncData[syncRequest.dbKey] ?? {lastUpdated: 0, oldestDeleted: 0};
			// Local has no sync data, or it's too old - tell local to send a full sync request for this module
			if (syncRequest.lastUpdated === 0 && remoteSyncData.lastUpdated > 0 || exists(remoteSyncData.oldestDeleted) && remoteSyncData.oldestDeleted > syncRequest.lastUpdated) {
				// full sync
				syncDataResponse.push({
					dbKey: syncRequest.dbKey,
					sync: SmartSync_FullSync,
					lastUpdated: remoteSyncData.lastUpdated,
				});
				return;
			}

			// Same lastUpdated timestamp in local and remote, no need to sync
			if (syncRequest.lastUpdated === remoteSyncData.lastUpdated) {
				// no sync
				syncDataResponse.push({
					dbKey: syncRequest.dbKey,
					sync: SmartSync_UpToDateSync,
					lastUpdated: remoteSyncData.lastUpdated
				});
				return;
			}
			// Different lastUpdated timestamp in local and remote - tell local to send a delta sync request for this module
			if (syncRequest.lastUpdated !== remoteSyncData.lastUpdated) {
				// delta sync
				let toUpdate = [];
				try {
					toUpdate = await moduleToCheck.query.where({__updated: {$gte: syncRequest.lastUpdated}});
				} catch (e: any) {
					this.logWarningBold(`Module assumed to be normal DB module: ${moduleToCheck.getName()}, collection:${moduleToCheck.dbDef.dbKey}`);
					throw e;
				}
				const itemsToReturn = {
					toUpdate: toUpdate,
					toDelete: await this.queryDeleted(syncRequest.dbKey, {where: {__updated: {$gte: syncRequest.lastUpdated}}})
				};

				syncDataResponse.push({
					dbKey: syncRequest.dbKey,
					sync: SmartSync_DeltaSync,
					lastUpdated: remoteSyncData.lastUpdated,
					items: itemsToReturn
				});
			}
		}));

		return {
			modules: syncDataResponse
		};
	};

	public getOrCreateSyncData = async (body: Request_SmartSync) => {
		const rtdbSyncData = await this.syncData.get({});

		const missingModules = this.dbModules.filter(dbModule => {
			const dbBE_SyncData = rtdbSyncData[dbModule.dbDef.dbKey];
			if (!dbBE_SyncData)
				return true;

			// const dbFE_SyncData = body.modules.find(module => module.dbName === dbModule.getCollectionName());
			// if (!dbFE_SyncData)
			return false;

			// return dbFE_SyncData.lastUpdated > dbBE_SyncData.lastUpdated;
		});

		if (missingModules.length) {
			this.logWarning(`Syncing missing modules: `, missingModules.map(module => module.dbDef.dbKey));
			const query: FirestoreQuery<DB_Object> = {limit: 1, orderBy: [{key: '__updated', order: 'desc'}]};
			const newestItems = (await Promise.all(missingModules.map(async missingModule => {
				try {
					return await missingModule.query.custom(query);
				} catch (e) {
					return [];
				}
			})));

			newestItems.forEach((item, index) => rtdbSyncData[missingModules[index].dbDef.dbKey] = {lastUpdated: item[0]?.__updated || 0});
			await this.syncData.set(rtdbSyncData);
		}

		return rtdbSyncData;
	};

	private prepareItemToDelete = (collectionName: string, item: DB_Object, uniqueKeys: string[] = ['_id']): PreDB<DeletedDBItem> => {
		const {_id, __updated, __created, _v} = item;
		const deletedItem: PreDB<DeletedDBItem> = {
			__docId: _id,
			__updated,
			__created,
			_v,
			__collectionName: collectionName
		};
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

	public getFullSyncData = async () => {
		return (await this.syncData.get({}));
	};

	async setLastUpdated(collectionName: string, lastUpdated: number) {
		return this.database.patch<LastUpdated>(`/state/${this.getName()}/syncData/${collectionName}`, {lastUpdated});
	}

	async setOldestDeleted(collectionName: string, oldestDeleted: number) {
		return this.database.patch<LastUpdated>(`/state/${this.getName()}/syncData/${collectionName}`, {oldestDeleted});
	}

	setModuleFilter = (filter: (modules: (ModuleBE_BaseDBV3<any>)[]) => Promise<(ModuleBE_BaseDBV3<any>)[]>) => {
		const previousFilter = this.filterModules;
		this.filterModules = async modules => filter(await previousFilter(modules));
	};

	private filterModules = async (modules: (ModuleBE_BaseDBV3<any>)[]) => {
		return modules;
	};
}

export const ModuleBE_SyncManager = new ModuleBE_SyncManager_Class();

