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
	_keys,
	arrayToMap,
	BadImplementationException,
	currentTimeMillis,
	DB_Object,
	DBDef,
	exists,
	filterDuplicates,
	LogLevel,
	Module,
	PreDB,
	RuntimeModules,
	tsValidateMustExist,
	UniqueId
} from '@nu-art/ts-common';
import {FirestoreCollectionV2} from '@nu-art/firebase/backend/firestore-v2/FirestoreCollectionV2';
import {firestore} from 'firebase-admin';
import {OnModuleCleanupV2} from '../backup/ModuleBE_v2_BackupScheduler';
import {createBodyServerApi, createQueryServerApi} from '../../core/typed-api';
import {addRoutes} from '../ModuleBE_APIs';
import {ModuleBE_BaseDBV2} from '../db-api-gen/ModuleBE_BaseDBV2';
import {ModuleBE_BaseDBV3} from '../db-api-gen/ModuleBE_BaseDBV3';
import {ApiDef_SyncManagerV2} from '../../../shared/sync-manager/apis';
import {
	DBSyncData_OLD,
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
export class ModuleBE_v2_SyncManager_Class
	extends Module<Config>
	implements OnModuleCleanupV2 {

	public collection!: FirestoreCollectionV2<DeletedDBItem>;

	private database!: DatabaseWrapperBE;
	private dbModules!: (ModuleBE_BaseDBV2<any> | ModuleBE_BaseDBV3<any>)[];
	private syncData!: FirebaseRef<SyncDataFirebaseState>;
	private deletedCount!: FirebaseRef<number>;
	public checkSyncApi;
	public smartSyncApi;

	constructor() {
		super();
		this.setMinLevel(LogLevel.Debug);
		this.checkSyncApi = createQueryServerApi(ApiDef_SyncManagerV2.v1.checkSync, this.fetchDBSyncData);
		this.smartSyncApi = createBodyServerApi(ApiDef_SyncManagerV2.v1.smartSync, this.calculateSmartSync);

		this.setDefaultConfig({retainDeletedCount: 1000});
	}

	init() {
		const firestore = ModuleBE_Firebase.createAdminSession().getFirestoreV2();
		this.collection = firestore.getCollection<DeletedDBItem>(DBDef_DeletedItems);

		this.dbModules = RuntimeModules().filter(module => ((module as unknown as {
			ModuleBE_BaseDBV2: boolean
		}).ModuleBE_BaseDBV2));
		this.database = ModuleBE_Firebase.createAdminSession().getDatabase();
		this.syncData = this.database.ref<SyncDataFirebaseState>(`/state/${this.getName()}/syncData`);
		this.deletedCount = this.database.ref<number>(`/state/${this.getName()}/deletedCount`);
		addRoutes([this.checkSyncApi, this.smartSyncApi]);
	}

	private calculateSmartSync = async (body: Request_SmartSync): Promise<Response_SmartSync> => {
		this.logError('Smart Sync!!!');
		const wantedCollectionNames = body.modules.map(item => item.dbName);
		this.logInfo(`Modules wanted: ${__stringify(wantedCollectionNames)}`);
		// const modulesArray = RuntimeModules().filter<ModuleBE_BaseDBV2<any>>((module: DBModuleType) => exists(module.dbDef?.dbName) && wantedCollectionNames.includes(module.dbDef?.dbName!));
		// const modulesArray = RuntimeModules().filter<ModuleBE_BaseApiV2_Class<any>>((module: ApiModule) => !!module.dbModule?.dbDef?.dbName && exists(module.apiDef) && wantedCollectionNames.includes(module.dbModule.dbDef.dbName));
		const modulesArray: (ModuleBE_BaseDBV2<any> | ModuleBE_BaseDBV3<any>)[] = await this.filterModules(this.dbModules.filter(dbModule => wantedCollectionNames.includes(dbModule.dbDef.dbName)));

		this.logInfo(`Modules found: ${__stringify(modulesArray.map(_module => _module.dbDef.dbName))}`);
		const modulesMap = arrayToMap(modulesArray, (item: (ModuleBE_BaseDBV2<any> | ModuleBE_BaseDBV3<any>)) => item.dbDef.dbName);
		// this.logWarningBold(`Modules map: ${(_keys(modulesMap) as string[]).map(key => `\nkey: ${modulesMap[key].dbDef.dbName}, module: ${modulesMap[key].getName()}`)}`);
		const syncDataResponse: (NoNeedToSyncModule | DeltaSyncModule | FullSyncModule)[] = [];
		const upToDateSyncData = await this.syncData.get();

		// For each module, create the response, which says what type of sync it needs: none, delta or full.
		await Promise.all(body.modules.map(async syncRequest => {
			const moduleToCheck = modulesMap[syncRequest.dbName] as (ModuleBE_BaseDBV2<any> | ModuleBE_BaseDBV3<any>);
			if (!moduleToCheck)
				throw new BadImplementationException(`Calculating collections to sync, failing to find dbName: ${syncRequest.dbName}`);

			const remoteSyncData = upToDateSyncData[syncRequest.dbName];
			// Local has no sync data, or it's too old - tell local to send a full sync request for this module
			if (syncRequest.lastUpdated === 0 || exists(remoteSyncData.oldestDeleted) && remoteSyncData.oldestDeleted > syncRequest.lastUpdated) {
				// full sync
				syncDataResponse.push({
					dbName: syncRequest.dbName,
					sync: SmartSync_FullSync,
					lastUpdated: remoteSyncData.lastUpdated,
				});
				return;
			}
			// Same lastUpdated timestamp in local and remote, no need to sync
			if (syncRequest.lastUpdated === remoteSyncData.lastUpdated) {
				// no sync
				syncDataResponse.push({
					dbName: syncRequest.dbName,
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
					this.logWarningBold(`Module assumed to be normal DB module: ${moduleToCheck.getName()}, collection:${moduleToCheck.dbDef.dbName}`);
					throw e;
				}
				const itemsToReturn = {
					toUpdate: toUpdate,
					toDelete: await this.queryDeleted(syncRequest.dbName, {where: {__updated: {$gte: syncRequest.lastUpdated}}})
				};

				syncDataResponse.push({
					dbName: syncRequest.dbName,
					sync: SmartSync_DeltaSync,
					lastUpdated: remoteSyncData.lastUpdated,
					items: itemsToReturn
				});
				return;
			}
		}));

		return {
			modules: syncDataResponse
		};
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

	public fetchDBSyncData = async (_: undefined) => {
		const fbSyncData = await this.getFullSyncData();

		const modulesToIterate = await this.filterModules(this.dbModules);
		// this.logWarning(`Filtered Modules to sync on(${modulesToIterate.length}):`, modulesToIterate.map(mod => mod.dbDef.dbName));
		// @ts-ignore
		const missingModules = modulesToIterate.filter(dbModule => !fbSyncData[dbModule.getCollectionName()]);

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

		const syncData = _keys(fbSyncData).reduce<DBSyncData_OLD[]>((response, dbName) => {
			if (!modulesToIterate.find(module => module.dbDef.dbName === dbName))
				return response;

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

	setModuleFilter = (filter: (modules: (ModuleBE_BaseDBV2<any, any> | ModuleBE_BaseDBV3<any>)[]) => Promise<(ModuleBE_BaseDBV2<any, any> | ModuleBE_BaseDBV3<any>)[]>) => {
		const previousFilter = this.filterModules;
		this.filterModules = async modules => filter(await previousFilter(modules));
	};

	private filterModules = async (modules: (ModuleBE_BaseDBV2<any, any> | ModuleBE_BaseDBV3<any>)[]) => {
		return modules;
	};
}

export const DBDef_DeletedItems: DBDef<DeletedDBItem> = {
	validator: tsValidateMustExist,
	dbName: '__deleted__docs',
	entityName: 'DeletedDoc',
	versions: ['1.0.0'],
};

export const ModuleBE_v2_SyncManager = new ModuleBE_v2_SyncManager_Class();

