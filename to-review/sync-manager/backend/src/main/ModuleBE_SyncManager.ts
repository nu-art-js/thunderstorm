/*
 * @nu-art/sync-manager-backend - Sync manager backend (onPostWrite + smartSync API)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {FirestoreQuery} from '@nu-art/firebase-shared';
import {DatabaseWrapperBE, ModuleBE_Firebase} from '@nu-art/firebase-backend';
import {FirestoreCollectionV3} from '@nu-art/firebase-backend/firestore-v3/FirestoreCollectionV3';
import type {DatabaseDef_DeletedDoc, SyncableCollectionBE, SyncPostWriteData, SyncPostWriteOptions} from '@nu-art/sync-manager-shared';
import {
	ApiDef_SyncManager,
	DB_DeletedDoc,
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
import {
	__stringify,
	arrayToMap,
	asArray,
	currentTimeMillis,
	DB_Object,
	exists,
	filterInstances,
	LogLevel,
	Module,
	PreDB,
	ResolvableContent,
	resolveContent
} from '@nu-art/ts-common';
import {ApiHandler} from '@nu-art/http-server';
import type {Transaction} from 'firebase-admin/firestore';

export type SyncManagerBEConfig = {
	retainDeletedCount: number;
};

/**
 * Sync manager backend: exposes onPostWrite (app calls it after writes) and smartSync API.
 * App supplies getSyncableCollections so this package does not depend on db-api or Storm/RuntimeModules.
 */
export class ModuleBE_SyncManager_Class
	extends Module<SyncManagerBEConfig> {

	public collection!: FirestoreCollectionV3<DatabaseDef_DeletedDoc>;

	private database!: DatabaseWrapperBE;
	private syncableCollections!: SyncableCollectionBE[];
	private resolvableFirebaseBasePath: ResolvableContent<string> = `/state/${this.getName()}`;

	constructor(private readonly getSyncableCollections: () => SyncableCollectionBE[]) {
		super();
		this.setMinLevel(LogLevel.Debug);
		this.setDefaultConfig({retainDeletedCount: 1000});
	}

	init(): void {
		const firestore = ModuleBE_Firebase.createAdminSession().getFirestoreV3();
		this.collection = firestore.getCollection(DBDef_DeletedDoc);
		this.syncableCollections = this.getSyncableCollections();
		this.database = ModuleBE_Firebase.createAdminSession().getDatabase();
	}

	@ApiHandler(() => ApiDef_SyncManager.smartSync)
	async calculateSmartSync(body: SyncManagerAPI_SmartSync['request']): Promise<SyncManagerAPI_SmartSync['response']> {
		const frontendCollectionNames = body.modules.map(item => item.dbKey);
		this.logVerbose(`Modules wanted: ${__stringify(frontendCollectionNames)}`);

		const permissibleCollections: SyncableCollectionBE[] = await this.filterModules(
			this.syncableCollections.filter(c => frontendCollectionNames.includes(c.dbKey))
		);
		const modulesAllowed = filterInstances(permissibleCollections.map(c => c.dbKey));
		this.logVerbose(`Modules found: ${__stringify(modulesAllowed)}`);

		const dbNameToCollectionMap = arrayToMap(permissibleCollections, (item: SyncableCollectionBE) => item.dbKey);
		const syncDataResponse: (NoNeedToSyncModule | DeltaSyncModule | FullSyncModule)[] = [];
		const upToDateSyncData = await this.getOrCreateSyncData();

		await Promise.all(body.modules.map(async syncRequest => {
			const collectionToCheck = dbNameToCollectionMap[syncRequest.dbKey] as SyncableCollectionBE;
			if (!collectionToCheck)
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
				let itemsToReturn: Response_DBSync<any>;
				try {
					itemsToReturn = await this.querySyncResponse(collectionToCheck, syncRequest.lastUpdated);
				} catch (e: unknown) {
					this.logWarningBold(`Collection failed for dbKey: ${collectionToCheck.dbKey}`);
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

		const missingCollections = this.syncableCollections.filter(c => !rtdbSyncData[c.dbKey]);

		if (missingCollections.length) {
			this.logWarning(`Syncing missing modules: `, missingCollections.map(c => c.dbKey).sort());
			const newestTimestamps = await Promise.all(missingCollections.map(async c => {
				try {
					return await c.getNewestTimestamp();
				} catch (e: unknown) {
					this.logError(e as Error);
					return 0;
				}
			}));
			newestTimestamps.forEach((ts, index) => {
				rtdbSyncData[missingCollections[index].dbKey] = {lastUpdated: ts};
			});
			await syncDataRef.set(rtdbSyncData);
		}

		return rtdbSyncData;
	};

	/**
	 * Build sync response for a collection and since timestamp: live items (from collection) + deleted items (from this store).
	 */
	querySyncResponse = async (collection: SyncableCollectionBE, since: number): Promise<Response_DBSync<any>> => {
		const toUpdate = await collection.queryUpdatedSince(since);
		const query: FirestoreQuery<DB_Object> = {where: {__updated: {$gte: since}}};
		const toDelete = await this.queryDeleted(collection.dbKey, query);
		return {toUpdate, toDelete};
	};

	private prepareItemToDelete = (collectionName: string, item: DB_Object, uniqueKeys: string[] = ['_id']): PreDB<DB_DeletedDoc> => {
		const {_id, __updated, __created, _v} = item;
		const deletedItem: PreDB<DB_DeletedDoc> = {
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

	/**
	 * Call this after each write (create/set/update/delete). The app is responsible for invoking it; db-api does not.
	 */
	async onPostWrite(collectionName: string, data: SyncPostWriteData, options: SyncPostWriteOptions): Promise<void> {
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

	queryDeleted = async (collectionName: string, query: FirestoreQuery<DB_Object>): Promise<DB_DeletedDoc[]> => {
		const finalQuery = {
			...query,
			where: {...query.where, __collectionName: collectionName},
		} as FirestoreQuery<DB_DeletedDoc>;
		const deletedItems = await this.collection.query.custom(finalQuery);
		deletedItems.forEach(_item => { _item._id = (_item.__docId ?? _item._id) as DB_DeletedDoc['_id']; });
		return deletedItems;
	};

	private async setLastUpdated(collectionName: string, lastUpdated: number): Promise<void> {
		await this.database.patch<LastUpdated>(`${resolveContent(this.resolvableFirebaseBasePath)}/syncData/${collectionName}`, {lastUpdated});
	}

	private async setOldestDeleted(collectionName: string, oldestDeleted: number): Promise<void> {
		await this.database.patch<LastUpdated>(`${resolveContent(this.resolvableFirebaseBasePath)}/syncData/${collectionName}`, {oldestDeleted});
	}

	private async onItemsDeleted(collectionName: string, items: DB_Object[], uniqueKeys: string[] = ['_id'], transaction?: unknown): Promise<void> {
		const toInsert: PreDB<DB_DeletedDoc>[] = items.map(item => this.prepareItemToDelete(collectionName, item, uniqueKeys));
		const now = currentTimeMillis();
		toInsert.forEach(item => item.__updated = now);
		await this.collection.create.all(toInsert, transaction as Transaction);
		const deletedCountRef = this.database.ref<number>(`${resolveContent(this.resolvableFirebaseBasePath)}/deletedCount`);
		let deletedCount = await deletedCountRef.get(0);
		deletedCount += items.length;
		await deletedCountRef.set(deletedCount);
	}

	setModuleFilter = (filter: (collections: SyncableCollectionBE[]) => Promise<SyncableCollectionBE[]>): void => {
		const previousFilter = this.filterModules;
		this.filterModules = async collections => filter(await previousFilter(collections));
	};

	setResolvablePath = (resolvablePath: ResolvableContent<string>): void => {
		this.resolvableFirebaseBasePath = resolvablePath;
	};

	private filterModules = async (collections: SyncableCollectionBE[]): Promise<SyncableCollectionBE[]> => collections;
}
