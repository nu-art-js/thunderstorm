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
import {FirestoreCollection} from '@nu-art/firebase-backend/firestore/FirestoreCollection';
import {
	__stringify,
	arrayToMap,
	asArray,
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
	TypedMap
} from '@nu-art/ts-common';
import {Transaction} from 'firebase-admin/firestore';
import {ModuleBE_BaseDB, RuntimeBE_ModulesDB} from '@nu-art/db-api-backend';
import {asSetupTaskKey, type PerformProjectSetup, type SetupTask} from '@nu-art/action-processor-backend';
import {
	ApiDef_SyncManager,
	DeltaSyncModule,
	FullSyncModule,
	LastUpdated,
	NoNeedToSyncModule,
	SmartSync_DeltaSync,
	SmartSync_FullSync,
	SmartSync_UpToDateSync,
	SyncDataFirebaseState,
	SyncManagerAPI_SmartSync
} from '@nu-art/sync-manager-shared';
import {DatabaseDef_DeletedDoc, DB_DeletedDoc, DBDef_DeletedDoc} from './deleted-doc/index.js';
import {ApiHandler} from '@nu-art/http-server';

export interface OnSyncEnvCompleted {
	__onSyncEnvCompleted: (env: string, baseUrl: string, requiredHeaders: TypedMap<string>) => void | Promise<void>;
}

export interface OnModuleCleanupV2 {
	__onCleanupInvokedV2: () => Promise<void>;
}

export type SyncManagerBEConfig = {
	retainDeletedCount: number
}

/**
 * # ModuleBE_SyncManager
 *
 * Manages all {@link ModuleBE_BaseDB} updates and deleted items to allow incremental sync with clients.
 *
 * ## Config:
 *
 * ```json
 * "ModuleBE_SyncManager" : {
 *   	retainDeletedCount: 100
 * }
 * ```
 */
export const SetupTaskKey_SyncBackfill = asSetupTaskKey('sync-manager-backfill');

export class ModuleBE_SyncManager_Class
	extends Module<SyncManagerBEConfig>
	implements OnModuleCleanupV2, OnSyncEnvCompleted, PerformProjectSetup {

	public collection!: FirestoreCollection<DatabaseDef_DeletedDoc>;

	private database!: DatabaseWrapperBE;
	private dbModules!: ModuleBE_BaseDB<any>[];
	private resolvableFirebaseBasePath: ResolvableContent<string> = `/state/${this.getName()}`;

	constructor() {
		super();
		this.setMinLevel(LogLevel.Debug);
		this.setDefaultConfig({retainDeletedCount: 1000});
	}

	async __onSyncEnvCompleted(env: string, baseUrl: string, requiredHeaders: TypedMap<string>) {
		await this.database.delete(resolveContent(this.resolvableFirebaseBasePath));
	}

	init() {
		const firestore = ModuleBE_Firebase.createAdminSession().getFirestore();
		this.collection = firestore.getCollection(DBDef_DeletedDoc as any);
		this.dbModules = RuntimeBE_ModulesDB();
		this.database = ModuleBE_Firebase.createAdminSession().getDatabase();

		for (const dbModule of this.dbModules) {
			const dbKey = dbModule.dbDef.dbKey;
			dbModule.registerPostWriteInterceptor(async (data) => {
				const items = [
					...asArray(data.updated ?? []),
					...asArray(data.deleted ?? []),
				];
				const maxUpdated = items.reduce((acc, item) => Math.max(acc, item.__updated ?? 0), 0);
				if (maxUpdated > 0)
					await this.setLastUpdated(dbKey, maxUpdated);
			});
		}
	}

	__performProjectSetup(): SetupTask[] {
		return [{
			key: SetupTaskKey_SyncBackfill,
			dependsOn: [],
			processor: () => this.backfillStaleSyncTimestamps()
		}];
	}

	private async backfillStaleSyncTimestamps() {
		const syncDataRef = this.database.ref<SyncDataFirebaseState>(`${resolveContent(this.resolvableFirebaseBasePath)}/syncData`);
		const rtdbSyncData = await syncDataRef.get({});

		const staleModules = this.dbModules.filter(dbModule => {
			const syncData = rtdbSyncData[dbModule.dbDef.dbKey];
			return !syncData || !syncData.lastUpdated;
		});

		if (staleModules.length === 0)
			return;

		this.logWarning(`Backfilling stale sync timestamps for: [${staleModules.map(m => m.dbDef.dbKey).join(', ')}]`);

		const query: FirestoreQuery<DB_Object> = {limit: 1, orderBy: [{key: '__updated', order: 'desc'}]};
		await Promise.all(staleModules.map(async module => {
			try {
				const newest = (await module.query.unManipulatedQuery(query))[0] as DB_Object | undefined;
				if (newest?.__updated) {
					rtdbSyncData[module.dbDef.dbKey] = {lastUpdated: newest.__updated};
					this.logInfo(`  ${module.dbDef.dbKey}: backfilled to ${newest.__updated}`);
				}
			} catch (e: any) {
				dispatch_onApplicationException.dispatchModule(e, this);
				this.logError(`Failed to backfill ${module.dbDef.dbKey}`, e);
			}
		}));

		await syncDataRef.set(rtdbSyncData);
	}

	@ApiHandler(ApiDef_SyncManager.smartSync)
	async calculateSmartSync(body: SyncManagerAPI_SmartSync['request']): Promise<SyncManagerAPI_SmartSync['response']> {
		const frontendCollectionNames = body.modules.map(item => item.dbKey);
		this.logVerbose(`Modules wanted: ${__stringify(frontendCollectionNames)}`);

		const permissibleModules: ModuleBE_BaseDB<any>[] = await this.filterModules(this.dbModules.filter(dbModule => frontendCollectionNames.includes(dbModule.dbDef.dbKey)));
		const modulesAllowed = filterInstances(permissibleModules.map(_module => _module.dbDef.dbKey));
		this.logVerbose(`Modules found: ${__stringify(modulesAllowed)}`);
		this.logVerbose(`Modules not found: ${frontendCollectionNames.filter(collectionName => modulesAllowed.includes(collectionName))}`);

		const dbNameToModuleMap = arrayToMap(permissibleModules, (item: ModuleBE_BaseDB<any>) => item.dbDef.dbKey);
		const syncDataResponse: (NoNeedToSyncModule | DeltaSyncModule | FullSyncModule)[] = [];
		const upToDateSyncData = await this.getOrCreateSyncData();

		await Promise.all(body.modules.map(async syncRequest => {
			const moduleToCheck = dbNameToModuleMap[syncRequest.dbKey] as ModuleBE_BaseDB<any>;
			if (!moduleToCheck)
				return this.logError(`Calculating collections to sync, failing to find dbKey: ${syncRequest.dbKey}`);

			const remoteSyncData = upToDateSyncData[syncRequest.dbKey] ?? {lastUpdated: 0, oldestDeleted: 0};
			if (syncRequest.lastUpdated === 0 && remoteSyncData.lastUpdated > 0 || exists(remoteSyncData.oldestDeleted) && remoteSyncData.oldestDeleted > syncRequest.lastUpdated) {
				syncDataResponse.push({
					dbKey: syncRequest.dbKey,
					sync: SmartSync_FullSync,
					lastUpdated: remoteSyncData.lastUpdated,
				});
				return;
			}

			if (syncRequest.lastUpdated === remoteSyncData.lastUpdated) {
				syncDataResponse.push({
					dbKey: syncRequest.dbKey,
					sync: SmartSync_UpToDateSync,
					lastUpdated: remoteSyncData.lastUpdated
				});
				return;
			}

			if (syncRequest.lastUpdated !== remoteSyncData.lastUpdated) {
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
	}

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

			return false;
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

	private prepareItemToDelete = (collectionName: string, item: DB_Object, uniqueKeys: string[] = ['_id']): PreDB<DB_DeletedDoc> => {
		const {_id, __updated, __created, _v} = item;
		const deletedItem: PreDB<DB_DeletedDoc> = {
			__docId: _id,
			__updated,
			__created,
			_v,
			__collectionName: collectionName
		};
		uniqueKeys.forEach(key => {
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

	async queryDeleted(collectionName: string, query: FirestoreQuery<DB_Object>): Promise<DB_DeletedDoc[]> {
		const finalQuery = {
			...query,
			where: {...query.where, __collectionName: collectionName}
		} as FirestoreQuery<DB_DeletedDoc>;

		const deletedItems = await this.collection.query.custom(finalQuery);
		deletedItems.forEach(_item => _item._id = (_item.__docId || _item._id) as typeof _item._id);
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

	setModuleFilter = (filter: (modules: ModuleBE_BaseDB<any>[]) => Promise<ModuleBE_BaseDB<any>[]>) => {
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

	private filterModules = async (modules: ModuleBE_BaseDB<any>[]) => {
		return modules;
	};
}

export const ModuleBE_SyncManager = new ModuleBE_SyncManager_Class();
