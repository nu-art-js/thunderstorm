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

import {_EmptyQuery, FirestoreQuery} from '@nu-art/firebase-shared';
import {DatabaseWrapperBE, ModuleBE_Firebase} from '@nu-art/firebase-backend';
import {
	__stringify,
	arrayToMap,
	currentTimeMillis,
	DB_Object,
	dispatch_onApplicationException,
	exists,
	filterDuplicates,
	filterInstances,
	LogLevel,
	Module,
	PreDB,
	ResolvableContent,
	resolveContent,
	RuntimeModules,
	TypedMap,
	UniqueId
} from '@nu-art/ts-common';
import {firestore} from 'firebase-admin';
import {createBodyServerApi} from '../../core/typed-api.js';
import {addRoutes} from '../ModuleBE_APIs.js';
import {ModuleBE_BaseDB} from '../db-api-gen/ModuleBE_BaseDB.js';
import {
	DeltaSyncModule,
	FullSyncModule,
	LastUpdated,
	NoNeedToSyncModule,
	Response_DBSync,
	SmartSync_DeltaSync,
	SmartSync_FullSync,
	SmartSync_UpToDateSync,
	SyncDataFirebaseState
} from '@nu-art/thunderstorm-shared/sync-manager/types';
import {DBDef_DeletedDoc, DatabaseDef_DeletedDoc} from '@nu-art/thunderstorm-shared';
import {OnSyncEnvCompleted} from '../sync-env/ModuleBE_SyncEnv.js';
import {OnModuleCleanupV2} from '../../_entity.js';
import {FirestoreCollectionV3} from '@nu-art/firebase-backend/firestore-v3/FirestoreCollectionV3';
import {ApiDef_SyncManager, SyncManagerAPI_SmartSync} from '@nu-art/thunderstorm-shared/sync-manager/apis';
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

	public collection!: FirestoreCollectionV3<DatabaseDef_DeletedDoc>;

	private database!: DatabaseWrapperBE;
	private dbModules!: (ModuleBE_BaseDB<any>)[];
	public smartSyncApi;
	private resolvableFirebaseBasePath: ResolvableContent<string> = `/state/${this.getName()}`;

	constructor() {
		super();
		this.setMinLevel(LogLevel.Debug);
		this.smartSyncApi = createBodyServerApi(ApiDef_SyncManager.smartSync, this.calculateSmartSync);

		this.setDefaultConfig({retainDeletedCount: 1000});
	}

	async __onSyncEnvCompleted(env: string, baseUrl: string, requiredHeaders: TypedMap<string>) {
		await this.database.delete(resolveContent(this.resolvableFirebaseBasePath));
	}

	init() {
		const firestore = ModuleBE_Firebase.createAdminSession().getFirestoreV3();
		this.collection = firestore.getCollection(DBDef_DeletedDoc);

		this.dbModules = RuntimeModules().filter(module => ((module as unknown as {
			ModuleBE_BaseDBV2: boolean
		}).ModuleBE_BaseDBV2));
		this.database = ModuleBE_Firebase.createAdminSession().getDatabase();
		addRoutes([this.smartSyncApi]);
	}

	private calculateSmartSync = async (body: SyncManagerAPI_SmartSync['request']): Promise<SyncManagerAPI_SmartSync['response']> => {
		const frontendCollectionNames = body.modules.map(item => item.dbKey);
		this.logVerbose(`Modules wanted: ${__stringify(frontendCollectionNames)}`);

		const permissibleModules: (ModuleBE_BaseDB<any>)[] = await this.filterModules(this.dbModules.filter(dbModule => frontendCollectionNames.includes(dbModule.dbDef.dbKey)));
		const modulesAllowed = filterInstances(permissibleModules.map(_module => _module.dbDef.dbKey));
		this.logVerbose(`Modules found: ${__stringify(modulesAllowed)}`);
		this.logVerbose(`Modules not found: ${frontendCollectionNames.filter(collectionName => modulesAllowed.includes(collectionName))}`);

		const dbNameToModuleMap = arrayToMap(permissibleModules, (item: (ModuleBE_BaseDB<any>)) => item.dbDef.dbKey);
		const syncDataResponse: (NoNeedToSyncModule | DeltaSyncModule | FullSyncModule)[] = [];
		const upToDateSyncData = await this.getOrCreateSyncData();

		// For each module, create the response, which says what type of sync it needs: none, delta or full.
		await Promise.all(body.modules.map(async syncRequest => {
			const moduleToCheck = dbNameToModuleMap[syncRequest.dbKey] as (ModuleBE_BaseDB<any>);
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
				const sinceQuery: FirestoreQuery<DB_Object> = {where: {__updated: {$gte: syncRequest.lastUpdated}}};
				let itemsToReturn: Response_DBSync<any>;
				try {
					itemsToReturn = await this.querySyncResponse(moduleToCheck, sinceQuery);
				} catch (e: unknown) {
					this.logWarningBold(`Module assumed to be normal DB module: ${moduleToCheck.getName()}, collection:${moduleToCheck.dbDef.dbKey}`);
					throw e;
				}
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

	public getOrCreateSyncData = async () => {
		this.logVerbose('Current node path', `${resolveContent(this.resolvableFirebaseBasePath)}/syncData`);
		const syncDataRef = this.database.ref<SyncDataFirebaseState>(`${resolveContent(this.resolvableFirebaseBasePath)}/syncData`);
		const rtdbSyncData = await syncDataRef.get({});

		const dbModuleDbKeys: string[] = filterInstances(this.dbModules.map(module => module.dbDef.dbKey));
		this.logVerbose(`BE DB Modules: ${__stringify(dbModuleDbKeys)}`);

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
			this.logWarning(`Syncing missing modules: `, missingModules.map(module => module.dbDef.dbKey).sort());
			const query: FirestoreQuery<DB_Object> = {limit: 1, orderBy: [{key: '__updated', order: 'desc'}]};
			const newestItems = (await Promise.all(missingModules.map(async missingModule => {
				try {
					return (await missingModule.query.unManipulatedQuery(query))[0] as DB_Object;
				} catch (e: any) {
					dispatch_onApplicationException.dispatchModule(e, this);
					this.logError(e);
				}
			})));

			newestItems.forEach((item, index) => rtdbSyncData[missingModules[index].dbDef.dbKey] = {lastUpdated: item?.__updated || 0});
			await syncDataRef.set(rtdbSyncData);
		}

		return rtdbSyncData;
	};

	/**
	 * Build sync response for a module and query: live items (from module) + deleted items (from this store).
	 * Replaces the former BaseDB.querySync orchestration.
	 */
	querySyncResponse = async (module: ModuleBE_BaseDB<any>, query: FirestoreQuery<DB_Object>): Promise<Response_DBSync<any>> => {
		const toUpdate = await module.query.custom(query);
		const toDelete = await this.queryDeleted(module.dbDef.dbKey, query);
		return {toUpdate, toDelete};
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
			//Don't replace the _id, some items in the system have a calculated _id and can be deleted and created over and over.
			if (key === '_id')
				return;
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
		const deletedCountRef = this.database.ref<number>(`${resolveContent(this.resolvableFirebaseBasePath)}/deletedCount`);
		let deletedCount = await deletedCountRef.get(0);
		deletedCount += items.length;
		await deletedCountRef.set(deletedCount);
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

		const deletedCountRef = this.database.ref<number>(`${resolveContent(this.resolvableFirebaseBasePath)}/deletedCount`);
		let deletedCount = await deletedCountRef.get();
		if (deletedCount === undefined) {
			deletedCount = (await this.collection.query.custom(_EmptyQuery)).length;
			await deletedCountRef.set(deletedCount);
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

		await deletedCountRef.set(newDeletedCount);
		const map = deleted.map(item => item.__collectionName);
		const keys = filterDuplicates(map);

		await Promise.all(keys.map(key => {
			const newestDeletedItem = deleted.find(deletedItem => deletedItem.__collectionName === key)!;
			this.logDebug(`setting oldest deleted timestamp ${key} = ${newestDeletedItem.__updated}`);
			return this.setOldestDeleted(key, newestDeletedItem.__updated);
		}));
	};

	public getFullSyncData = async () => {
		const syncDataRef = this.database.ref<SyncDataFirebaseState>(`${resolveContent(this.resolvableFirebaseBasePath)}/syncData`);
		return (await syncDataRef.get({}));
	};

	async setLastUpdated(collectionName: string, lastUpdated: number) {
		return this.database.patch<LastUpdated>(`${resolveContent(this.resolvableFirebaseBasePath)}/syncData/${collectionName}`, {lastUpdated});
	}

	async setOldestDeleted(collectionName: string, oldestDeleted: number) {
		return this.database.patch<LastUpdated>(`${resolveContent(this.resolvableFirebaseBasePath)}/deletedCount/${collectionName}`, {oldestDeleted});
	}

	setModuleFilter = (filter: (modules: (ModuleBE_BaseDB<any>)[]) => Promise<(ModuleBE_BaseDB<any>)[]>) => {
		const previousFilter = this.filterModules;
		this.filterModules = async modules => filter(await previousFilter(modules));
	};

	/**
	 * Set function that allows to set a custom resolver for the rtdb node path
	 * @param resolvablePath The resolver for the node path
	 */
	setResolvablePath = (resolvablePath: ResolvableContent<string>) => {
		this.resolvableFirebaseBasePath = resolvablePath;
	};

	private filterModules = async (modules: (ModuleBE_BaseDB<any>)[]) => {
		return modules;
	};
}

export const ModuleBE_SyncManager = new ModuleBE_SyncManager_Class();

