/*
 * @nu-art/sync-manager-backend - Sync manager backend (SyncNotifier + smartSync API)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {_EmptyQuery, FirestoreQuery} from '@nu-art/firebase-shared';
import {DatabaseWrapperBE, ModuleBE_Firebase} from '@nu-art/firebase-backend';
import {FirestoreCollectionV3} from '@nu-art/firebase-backend/firestore-v3/FirestoreCollectionV3';
import type {SyncNotifier, SyncNotifierOnPostWriteOptions, SyncNotifierPostWriteData} from '@nu-art/db-api-shared';
import type {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {
	__stringify,
	asArray,
	arrayToMap,
	currentTimeMillis,
	DB_Object,
	exists,
	filterInstances,
	LogLevel,
	Module,
	PreDB,
	ResolvableContent,
	resolveContent,
	UniqueId
} from '@nu-art/ts-common';
import {ApiHandler, HttpServer} from '@nu-art/http-server';
import {
	ApiDef_SyncManager,
	DBDef_DeletedDoc,
	DeltaSyncModule,
	FullSyncModule,
	LastUpdated,
	NoNeedToSyncModule,
	Response_DBSync,
	SmartSync_DeltaSync,
	SmartSync_FullSync,
	SmartSync_UpToDateSync,
	SyncDataFirebaseState,
	SyncManagerAPI_SmartSync
} from '@nu-art/sync-manager-shared';
import type {DBProto_DeletedDoc} from '@nu-art/sync-manager-shared';
import type {Transaction} from 'firebase-admin/firestore';

type DeletedDBItem = DB_Object & { __collectionName: string; __docId: UniqueId };

export type SyncManagerBEConfig = {
	retainDeletedCount: number;
};

/**
 * Sync manager backend: implements SyncNotifier for BaseDB and exposes smartSync API.
 * App supplies getDbModules so this package does not depend on Storm/RuntimeModules.
 */
export class ModuleBE_SyncManager_Class
	extends Module<SyncManagerBEConfig>
	implements SyncNotifier {

	public collection!: FirestoreCollectionV3<DBProto_DeletedDoc>;

	private database!: DatabaseWrapperBE;
	private dbModules!: (ModuleBE_BaseDB<any>)[];
	private resolvableFirebaseBasePath: ResolvableContent<string> = `/state/${this.getName()}`;

	constructor(private readonly getDbModules: () => (ModuleBE_BaseDB<any>)[]) {
		super();
		this.setMinLevel(LogLevel.Debug);
		this.setDefaultConfig({retainDeletedCount: 1000});
	}

	init(): void {
		const firestore = ModuleBE_Firebase.createAdminSession().getFirestoreV3();
		this.collection = firestore.getCollection(DBDef_DeletedDoc);
		this.dbModules = this.getDbModules();
		this.database = ModuleBE_Firebase.createAdminSession().getDatabase();
	}

	@ApiHandler(() => ApiDef_SyncManager.v1.smartSync, {httpServer: () => HttpServer.getDefault()})
	async calculateSmartSync(body: SyncManagerAPI_SmartSync['request']): Promise<SyncManagerAPI_SmartSync['response']> {
		const frontendCollectionNames = body.modules.map(item => item.dbKey);
		this.logVerbose(`Modules wanted: ${__stringify(frontendCollectionNames)}`);

		const permissibleModules: (ModuleBE_BaseDB<any>)[] = await this.filterModules(
			this.dbModules.filter(dbModule => frontendCollectionNames.includes(dbModule.dbDef.dbKey))
		);
		const modulesAllowed = filterInstances(permissibleModules.map(_module => _module.dbDef.dbKey));
		this.logVerbose(`Modules found: ${__stringify(modulesAllowed)}`);

		const dbNameToModuleMap = arrayToMap(permissibleModules, (item: ModuleBE_BaseDB<any>) => item.dbDef.dbKey);
		const syncDataResponse: (NoNeedToSyncModule | DeltaSyncModule | FullSyncModule)[] = [];
		const upToDateSyncData = await this.getOrCreateSyncData();

		await Promise.all(body.modules.map(async syncRequest => {
			const moduleToCheck = dbNameToModuleMap[syncRequest.dbKey] as ModuleBE_BaseDB<any>;
			if (!moduleToCheck)
				return this.logError(`Calculating collections to sync, failing to find dbKey: ${syncRequest.dbKey}`);

			const remoteSyncData = upToDateSyncData[syncRequest.dbKey] ?? {lastUpdated: 0, oldestDeleted: 0};
			if (syncRequest.lastUpdated === 0 && remoteSyncData.lastUpdated > 0 || exists(remoteSyncData.oldestDeleted) && remoteSyncData.oldestDeleted! > syncRequest.lastUpdated) {
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
					lastUpdated: remoteSyncData.lastUpdated,
				});
				return;
			}

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
					items: itemsToReturn,
				});
			}
		}));

		return {modules: syncDataResponse};
	}

	getOrCreateSyncData = async (): Promise<SyncDataFirebaseState> => {
		this.logVerbose('Current node path', `${resolveContent(this.resolvableFirebaseBasePath)}/syncData`);
		const syncDataRef = this.database.ref<SyncDataFirebaseState>(`${resolveContent(this.resolvableFirebaseBasePath)}/syncData`);
		const rtdbSyncData = await syncDataRef.get({});

		const missingModules = this.dbModules.filter(dbModule => !rtdbSyncData[dbModule.dbDef.dbKey]);

		if (missingModules.length) {
			this.logWarning(`Syncing missing modules: `, missingModules.map(module => module.dbDef.dbKey).sort());
			const query: FirestoreQuery<DB_Object> = {limit: 1, orderBy: [{key: '__updated', order: 'desc'}]};
			const newestItems = await Promise.all(missingModules.map(async missingModule => {
				try {
					return (await missingModule.query.unManipulatedQuery(query))[0] as DB_Object | undefined;
				} catch (e: unknown) {
					this.logError(e as Error);
					return undefined;
				}
			}));
			newestItems.forEach((item, index) => {
				rtdbSyncData[missingModules[index].dbDef.dbKey] = {lastUpdated: item?.__updated ?? 0};
			});
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
			__collectionName: collectionName,
		};
		uniqueKeys.forEach(key => {
			if (key === '_id')
				return;
			(deletedItem as Record<string, unknown>)[key] = (item as Record<string, unknown>)[key] ?? '';
		});
		return deletedItem;
	};

	async onPostWrite(collectionName: string, data: SyncNotifierPostWriteData, options: SyncNotifierOnPostWriteOptions): Promise<void> {
		const now = currentTimeMillis();
		const uniqueKeys = options.uniqueKeys ?? ['_id'];
		const transaction = options.transaction as Transaction | undefined;

		if (data.updated && !(Array.isArray(data.updated) && data.updated.length === 0)) {
			const updated = data.updated;
			const latestUpdated = Array.isArray(updated) ?
				updated.reduce((toRet, current) => Math.max(toRet, current.__updated), updated[0].__updated) :
				updated.__updated;
			await this.setLastUpdated(collectionName, latestUpdated);
		}

		if (data.deleted && !(Array.isArray(data.deleted) && data.deleted.length === 0)) {
			await this.onItemsDeleted(collectionName, asArray(data.deleted), uniqueKeys, transaction);
			await this.setLastUpdated(collectionName, now);
		} else if (data.deleted === null)
			await this.setOldestDeleted(collectionName, now);
	}

	queryDeleted = async (collectionName: string, query: FirestoreQuery<DB_Object>): Promise<DeletedDBItem[]> => {
		const finalQuery: FirestoreQuery<DeletedDBItem> = {
			...query,
			where: {...query.where, __collectionName: collectionName},
		};
		const deletedItems = await this.collection.query.custom(finalQuery);
		deletedItems.forEach(_item => { _item._id = _item.__docId ?? _item._id; });
		return deletedItems;
	};

	private async setLastUpdated(collectionName: string, lastUpdated: number): Promise<void> {
		await this.database.patch<LastUpdated>(`${resolveContent(this.resolvableFirebaseBasePath)}/syncData/${collectionName}`, {lastUpdated});
	}

	private async setOldestDeleted(collectionName: string, oldestDeleted: number): Promise<void> {
		await this.database.patch<LastUpdated>(`${resolveContent(this.resolvableFirebaseBasePath)}/syncData/${collectionName}`, {oldestDeleted});
	}

	private async onItemsDeleted(collectionName: string, items: DB_Object[], uniqueKeys: string[] = ['_id'], transaction?: unknown): Promise<void> {
		const toInsert = items.map(item => this.prepareItemToDelete(collectionName, item, uniqueKeys));
		const now = currentTimeMillis();
		toInsert.forEach(item => item.__updated = now);
		await this.collection.create.all(toInsert, transaction as Transaction);
		const deletedCountRef = this.database.ref<number>(`${resolveContent(this.resolvableFirebaseBasePath)}/deletedCount`);
		let deletedCount = await deletedCountRef.get(0);
		deletedCount += items.length;
		await deletedCountRef.set(deletedCount);
	}

	setModuleFilter = (filter: (modules: (ModuleBE_BaseDB<any>)[]) => Promise<(ModuleBE_BaseDB<any>)[]>): void => {
		const previousFilter = this.filterModules;
		this.filterModules = async modules => filter(await previousFilter(modules));
	};

	setResolvablePath = (resolvablePath: ResolvableContent<string>): void => {
		this.resolvableFirebaseBasePath = resolvablePath;
	};

	private filterModules = async (modules: (ModuleBE_BaseDB<any>)[]): Promise<(ModuleBE_BaseDB<any>)[]> => modules;
}
