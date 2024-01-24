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

import {_keys, DB_Object, debounce, Dispatcher, exists, LogLevel, Module, Queue, reduceToMap, RuntimeModules, Second, TypedMap} from '@nu-art/ts-common';
import {apiWithBody, apiWithQuery} from '../../core/typed-api';
import {
	ApiStruct_SyncManager,
	DBSyncData_OLD,
	DeltaSyncModule,
	FullSyncModule,
	LastUpdated,
	NoNeedToSyncModule,
	Request_SmartSync,
	Response_DBSync,
	Response_DBSyncData,
	Response_SmartSync,
	SmartSync_DeltaSync,
	SmartSync_FullSync,
	SmartSync_UpToDateSync,
	SyncDataFirebaseState,
	SyncDbData
} from '../../../shared/sync-manager/types';
import {ApiDefCaller, BodyApi, DBModuleType, HttpMethod} from '../../../shared';
import {ApiDef_SyncManagerV2} from '../../../shared/sync-manager/apis';
import {ModuleFE_BaseApi} from '../db-api-gen/ModuleFE_BaseApi';
import {ThunderDispatcher} from '../../core/thunder-dispatcher';
import {DataStatus, EventType_Query} from '../../core/db-api-gen/consts';
import {ModuleFE_FirebaseListener, RefListenerFE} from '@nu-art/firebase/frontend/ModuleFE_FirebaseListener/ModuleFE_FirebaseListener';
import {DataSnapshot} from 'firebase/database';
import {StorageKey} from '../ModuleFE_LocalStorage';


export type SyncIfNeeded = {
	__syncIfNeeded: (syncData: DBSyncData_OLD[]) => Promise<void>
}
export type OnSyncCompleted = {
	__onSyncCompleted: () => void
}

export interface PermissibleModulesUpdated {
	__onPermissibleModulesUpdated: () => void;
}

const Default_SyncManagerNodePath = '/state/ModuleBE_v2_SyncManager/syncData'; // Hardcoded path for now per Adam's request, should be const somewhere.
const StorageKey_SyncMode = new StorageKey<'old' | 'smart'>('storage-key--sync-mode').withstandDeletion();

export const dispatch_syncIfNeeded = new Dispatcher<SyncIfNeeded, '__syncIfNeeded'>('__syncIfNeeded');
export const dispatch_onSyncCompleted = new Dispatcher<OnSyncCompleted, '__onSyncCompleted'>('__onSyncCompleted');
export const dispatch_OnPermissibleModulesUpdated = new ThunderDispatcher<PermissibleModulesUpdated, '__onPermissibleModulesUpdated'>('__onPermissibleModulesUpdated');

export class ModuleFE_SyncManagerV2_Class
	extends Module
	implements ApiDefCaller<ApiStruct_SyncManager> {

	readonly v1;
	private syncQueue;

	// All the modules that a user has permissions to view and with the last updated timestamp of each collection
	private syncedModules_OLD: SyncDbData[] = [];
	private remoteSyncData: TypedMap<number> = {};
	private syncFirebaseListener?: RefListenerFE<SyncDataFirebaseState>;
	private debounceSync?: () => void;
	private outOfSyncCollections: Set<string> = new Set<string>();
	private syncing?: boolean;
	private pendingSync?: boolean;

	constructor() {
		super();
		this.setSyncMode('smart');
		this.setMinLevel(LogLevel.Debug);
		this.syncQueue = new Queue('Sync Queue').setParallelCount(4);
		this.v1 = {
			checkSync: apiWithQuery(ApiDef_SyncManagerV2.v1.checkSync, this.onReceivedSyncData),
		};
		// @ts-ignore
		window.toggleSyncMode = this.toggleSyncMode;
	}

	sync = async () => {
		if (StorageKey_SyncMode.get('old') === 'old')
			return this.v1.checkSync().executeSync();
	};

	private smartSync = async () => {
		const request: Request_SmartSync = {
			modules: this.getLocalSyncData()
		};

		if (this.syncing)
			this.pendingSync = true;
		this.syncing = true;

		// implement the smart sync call internal so no one will initiate it from the anywhere in the code, except this module
		await apiWithBody<BodyApi<Response_SmartSync, Request_SmartSync>>({
			method: HttpMethod.POST,
			path: 'v3/db-api/smart-sync',
			timeout: 60 * Second
		}, this.onSmartSyncCompleted)(request).executeSync();

		this.syncing = false;
		if (this.pendingSync) {
			delete this.pendingSync;
			await this.sync();
		}
	};

	private getAllDBModules = () => RuntimeModules().filter<ModuleFE_BaseApi<any>>((module: DBModuleType) => !!module.dbDef?.dbName);

	getLocalSyncData = (): SyncDbData[] => {
		const existingDBModules = this.getAllDBModules();
		return existingDBModules.map(module => ({
			dbName: module.dbDef.dbName,
			lastUpdated: module.IDB.getLastSync()
		}));
	};

	getSyncMode = () => StorageKey_SyncMode.get('old');
	isSmartSync = () => this.getSyncMode() === 'smart';

	setSyncMode = (syncMode: 'old' | 'smart') => {
		StorageKey_SyncMode.set(syncMode);
	};

	toggleSyncMode = (syncMode: 'old' | 'smart' = this.getSyncMode()) => {
		this.setSyncMode(syncMode === 'old' ? 'smart' : 'old');
	};

	private onSyncDataChanged = async (snapshot: DataSnapshot) => {
		this.logDebug('Received firebase state data');

		// remoteSyncData is the data we received from the firebase listener, that just detected a change.
		const rtdbSyncData = snapshot.val() as SyncDataFirebaseState | undefined;
		if (!rtdbSyncData)
			return await this.debounceSyncImpl();

		// localSyncData is the data we just collected from the IDB regarding all existing modules.
		const localSyncData = reduceToMap<SyncDbData, LastUpdated>(this.getLocalSyncData(), data => data.dbName, data => ({lastUpdated: data.lastUpdated}));
		// const permissibleCollections = this.syncedModules.map(module => module.dbName);
		(_keys(rtdbSyncData) as string[]).forEach((dbName) => {
			// this Should be taken care of by the below condition because both local and remote will return last updated 0
			if (!exists(this.remoteSyncData[dbName]))
				return;

			if (!localSyncData[dbName])
				return; // this.logVerbose(`onSyncDataChanged - couldn't find local syncData for collection ${dbName}`);

			if (rtdbSyncData[dbName].lastUpdated <= localSyncData[dbName].lastUpdated)
				return;

			this.outOfSyncCollections.add(dbName);
		});

		// // If there are no changes, just set all modules' data status to ContainsData
		// if (this.outOfSyncCollections.size === 0) {
		// 	// on sync completed
		// 	const allModulesAreUpToDate: NoNeedToSyncModule[] = (_keys(localSyncData) as string[]).map(dbName =>
		// 		({
		// 			dbName: dbName,
		// 			lastUpdated: localSyncData[dbName]?.lastUpdated ?? 0,
		// 			sync: SmartSync_UpToDateSync
		// 		}));
		// 	const setAllModulesAsContainData: Response_SmartSync = {modules: allModulesAreUpToDate};
		// 	await this.onSmartSyncCompleted(setAllModulesAsContainData);
		// }
		// If there are changes, call sync
		return await this.debounceSyncImpl();
	};

	private async debounceSyncImpl() {
		if (exists(this.debounceSync))
			return this.debounceSync();

		// Since RTDB event arrives upon start listening we would like to perform a first sync immediately,
		// therefor we call sync directly for the first event and create the debounce function right after for all the consecutive events
		this.debounceSync = debounce(async () => {
			if (!this.syncFirebaseListener)
				return this.logWarning('Ignoring sync data state, listener is undefined');

			this.logDebug(`Collections out of sync:`, this.outOfSyncCollections);
			this.outOfSyncCollections.clear();
			await this.smartSync();
		}, 1000, 5000);

		this.logInfo('Performing Immediate Sync');
		await this.smartSync();
	}

	public onReceivedSyncData = async (response: Response_DBSyncData) => {
		this.syncedModules_OLD = response.syncData.map(item => ({dbName: item.name, lastUpdated: item.lastUpdated}));

		dispatch_OnPermissibleModulesUpdated.dispatchUI();
		await dispatch_syncIfNeeded.dispatchModuleAsync(response.syncData);
		dispatch_onSyncCompleted.dispatchModule();
	};

	public getPermissibleModuleNames = () => this.syncedModules_OLD ? this.syncedModules_OLD.map(moduleSyncData => moduleSyncData.dbName) : undefined;

	/**
	 * Perform no sync, delta sync and full sync on modules. Intention is to get all modules to DataStatus "ContainsData".
	 */
	public onSmartSyncCompleted = async (response: Response_SmartSync) => {
		this.logInfo('onSmartSyncCompleted', response);
		this.syncedModules_OLD = response.modules.map(item => ({dbName: item.dbName, lastUpdated: item.lastUpdated}));

		// We want to make the modules available as soon as possible, so we finish off with the lighter load first, and do full syncs at the end.
		// Set DataStatus of modules that are already up-to-date, to be ContainsData.
		const modulesAlreadyUpToDate = response.modules.filter(module => module.sync === SmartSync_UpToDateSync) as NoNeedToSyncModule[];
		await Promise.all(modulesAlreadyUpToDate.map(async (upToDateModule) => {
			const module = RuntimeModules().find<ModuleFE_BaseApi<any>>((_module: DBModuleType) => _module.dbDef?.dbName === upToDateModule.dbName);
			if (!module)
				return this.logError(`Couldn't find module with dbName: '${upToDateModule.dbName}'`);

			await this.performNoSync(module);
		}));

		// Perform delta sync on all relevant modules
		const modulesToUpdate = response.modules.filter(module => module.sync === SmartSync_DeltaSync) as DeltaSyncModule[];
		for (const moduleToUpdate of modulesToUpdate) {
			const module = RuntimeModules().find<ModuleFE_BaseApi<any>>((module: DBModuleType) => module.dbDef?.dbName === moduleToUpdate.dbName);
			await this.performDeltaSync(module, moduleToUpdate.items);
		}

		// Perform full sync on all relevant modules
		const modulesToFullySync = response.modules.filter(module => module.sync === SmartSync_FullSync) as FullSyncModule[];
		modulesToFullySync.forEach(moduleToSync => {
			const module = RuntimeModules().find<ModuleFE_BaseApi<any>>((module: DBModuleType) => module.dbDef?.dbName === moduleToSync.dbName);

			if (!module)
				return this.logError(`Couldn't find module with dbName: '${moduleToSync.dbName}'`);

			this.syncQueue.addItem(async () => {
				try {
					await this.performFullSync(module);
				} catch (e: any) {
					this.logError(`Error while syncing ${module.dbDef.dbName}`, e);
					throw e;
				}
			});
		});

		this.syncedModules_OLD = response.modules.map(item => ({dbName: item.dbName, lastUpdated: item.lastUpdated}));
		dispatch_OnPermissibleModulesUpdated.dispatchUI();
		dispatch_onSyncCompleted.dispatchModule();
	};

	performNoSync = async (module: ModuleFE_BaseApi<any>) => {
		this.logVerbose(`No sync for: ${module.dbDef.dbName}, Already UpToDate.`);
		module.logVerbose(`Updating Cache: ${module.dbDef.dbName}`);
		await module.cache.load();
		module.logVerbose(`Firing event (DataStatus.ContainsData): ${module.dbDef.dbName}`);
		module.setDataStatus(DataStatus.ContainsData);
	};

	performFullSync = async (module: ModuleFE_BaseApi<any>) => {
		this.logDebug(`Full sync for: '${module.dbDef.dbName}'`);
		// module.logVerbose(`Firing event (DataStatus.NoData): ${module.dbDef.dbName}`);
		// module.setDataStatus(DataStatus.NoData); // module.IDB.clear() already sets the module's data status to NoData.

		// if the backend have decided module collection needs a full sync, we need to clean local idb and cache
		module.logVerbose(`Cleaning IDB: ${module.dbDef.dbName}`);
		await module.IDB.clear(); // Also sets the module's data status to NoData.
		module.logVerbose(`Cleaning Cache: ${module.dbDef.dbName}`);
		module.cache.clear();

		module.logVerbose(`Firing event (DataStatus.UpdatingData): ${module.dbDef.dbName}`);
		module.setDataStatus(DataStatus.UpdatingData);

		// for full sync go fetch all db items
		module.logVerbose(`Syncing: ${module.dbDef.dbName}`);
		const allItems = await module.v1.query({where: {}}).executeSync();

		module.logVerbose(`Updating IDB: ${module.dbDef.dbName}`);
		await module.IDB.syncIndexDb(allItems);
		module.logVerbose(`Updating Cache: ${module.dbDef.dbName}`);
		await module.cache.load();

		module.logVerbose(`Firing event (DataStatus.ContainsData): ${module.dbDef.dbName}`);
		module.setDataStatus(DataStatus.ContainsData);

		module.logVerbose(`Firing event (EventType_Query): ${module.dbDef.dbName}`);
		module.dispatchMulti(EventType_Query, allItems);

		this.logDebug(`Full Sync Completed: ${module.dbDef.dbName}`);
	};

	performDeltaSync = async <T extends DB_Object>(module: ModuleFE_BaseApi<T>, syncData: Response_DBSync<T>) => {
		this.logInfo(`Delta sync for: '${module.dbDef.dbName}'`);

		module.logVerbose(`Firing event (DataStatus.UpdatingData): ${module.dbDef.dbName}`);
		module.setDataStatus(DataStatus.UpdatingData);

		await module.onEntriesUpdated(syncData.toUpdate ?? []);
		await module.onEntriesDeleted((syncData.toDelete ?? []) as T[]);

		module.logVerbose(`Firing event (DataStatus.ContainsData): ${module.dbDef.dbName}`);
		module.setDataStatus(DataStatus.ContainsData);

		this.logDebug(`Delta Sync Completed: ${module.dbDef.dbName}`);
	};

	startListening() {
		// Hardcoded path for now per Adam's request, should be const somewhere.
		this.syncFirebaseListener = ModuleFE_FirebaseListener
			.createListener(Default_SyncManagerNodePath)
			.startListening(this.onSyncDataChanged);
	}

	stopListening() {
		this.syncFirebaseListener?.stopListening();
		this.syncFirebaseListener = undefined;
		this.debounceSync = undefined;
	}
}

export const ModuleFE_SyncManagerV2 = new ModuleFE_SyncManagerV2_Class();
