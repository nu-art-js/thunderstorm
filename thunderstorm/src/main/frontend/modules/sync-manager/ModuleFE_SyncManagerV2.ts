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

import {_keys, DB_Object, Dispatcher, LogLevel, Module, Queue, reduceToMap, RuntimeModules} from '@nu-art/ts-common';
import {apiWithBody, apiWithQuery} from '../../core/typed-api';
import {
	ApiStruct_SyncManager,
	DBSyncData_OLD,
	DeltaSyncModule,
	FullSyncModule,
	LastUpdated,
	Request_SmartSync,
	Response_DBSync,
	Response_DBSyncData,
	Response_SmartSync,
	SmartSync_DeltaSync,
	SmartSync_FullSync,
	SyncDataFirebaseState,
	SyncDbData
} from '../../../shared/sync-manager/types';
import {ApiDefCaller, DBModuleType} from '../../../shared';
import {ApiDef_SyncManagerV2} from '../../../shared/sync-manager/apis';
import {ModuleFE_BaseApi} from '../db-api-gen/ModuleFE_BaseApi';
import {ThunderDispatcher} from '../../core/thunder-dispatcher';
import {DataStatus, EventType_Query} from '../../core/db-api-gen/consts';
import {
	ModuleFE_FirebaseListener,
	RefListenerFE
} from '@nu-art/firebase/frontend/ModuleFE_FirebaseListener/ModuleFE_FirebaseListener';
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
	private syncedModules: SyncDbData[] = [];
	private syncFirebaseListener!: RefListenerFE<SyncDataFirebaseState>;

	constructor() {
		super();
		this.setMinLevel(LogLevel.Verbose);
		this.syncQueue = new Queue('Sync Queue').setParallelCount(4);
		this.v1 = {
			checkSync: apiWithQuery(ApiDef_SyncManagerV2.v1.checkSync, this.onReceivedSyncData),
			smartSync: apiWithBody(ApiDef_SyncManagerV2.v1.smartSync, this.onSmartSyncCompleted)
		};
		// @ts-ignore
		window.toggleSyncMode = this.toggleSyncMode;
	}

	sync = async () => {
		if (StorageKey_SyncMode.get('old') === 'old')
			return this.v1.checkSync().executeSync();

		const request: Request_SmartSync = {
			modules: this.getLocalSyncData()
		};
		return this.v1.smartSync(request).executeSync();
	};

	getLocalSyncData = (): SyncDbData[] => {
		const existingDBModules = RuntimeModules().filter<ModuleFE_BaseApi<any>>((module: DBModuleType) => !!module.dbDef?.dbName);
		return existingDBModules.map(module => ({dbName: module.dbDef.dbName, lastUpdated: module.IDB.getLastSync()}));
	};

	getSyncMode = () => StorageKey_SyncMode.get('old');

	toggleSyncMode = (syncMode: 'old' | 'smart' = this.getSyncMode()) => {
		StorageKey_SyncMode.set(syncMode === 'old' ? 'smart' : 'old');
	};

	protected init() {
		this.syncFirebaseListener = ModuleFE_FirebaseListener.createListener(Default_SyncManagerNodePath); // Hardcoded path for now per Adam's request, should be const somewhere.
		this.syncFirebaseListener.startListening(this.onSyncDataChanged);
	}

	private onSyncDataChanged = async (snapshot: DataSnapshot) => {
		this.logInfo('Received firebase state data');

		// remoteSyncData is the data we received from the firebase listener, that just detected a change.
		const remoteSyncData = snapshot.val() as SyncDataFirebaseState;
		// localSyncData is the data we just collected from the IDB regarding all existing modules.
		const localSyncData = reduceToMap<SyncDbData, LastUpdated>(this.getLocalSyncData(), data => data.dbName, data => ({lastUpdated: data.lastUpdated}));
		const permissibleCollections = this.syncedModules.map(module => module.dbName);
		const outOfDateCollections:string[] = [];
		const shouldSync: boolean = (_keys(remoteSyncData) as string[]).reduce((_shouldSync, dbName) => {
			if (_shouldSync)
				return _shouldSync;

			if (!permissibleCollections.includes(dbName))
				return false;

			if (!remoteSyncData[dbName])
				this.logError(`onSyncDataChanged - couldn't find remote syncData for collection ${dbName}`);
			if (!localSyncData[dbName])
				this.logError(`onSyncDataChanged - couldn't find local syncData for collection ${dbName}`);

			if (remoteSyncData[dbName].lastUpdated <= localSyncData[dbName].lastUpdated)
				return false;

			return true;
		}, false);

		//if there are changes, call sync
		if (shouldSync) {
			this.logInfo('Syncing due to updated RTDB sync-state.');
			await this.sync();
		}
	};

	public onReceivedSyncData = async (response: Response_DBSyncData) => {
		this.syncedModules = response.syncData.map(item => ({dbName: item.name, lastUpdated: item.lastUpdated}));

		dispatch_OnPermissibleModulesUpdated.dispatchUI();
		await dispatch_syncIfNeeded.dispatchModuleAsync(response.syncData);
		dispatch_onSyncCompleted.dispatchModule();
	};

	public getPermissibleModuleNames = () => this.syncedModules ? this.syncedModules.map(moduleSyncData => moduleSyncData.dbName) : undefined;

	public onSmartSyncCompleted = async (response: Response_SmartSync) => {
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

		const modulesToUpdate = response.modules.filter(module => module.sync === SmartSync_DeltaSync) as DeltaSyncModule[];
		for (const moduleToUpdate of modulesToUpdate) {
			const module = RuntimeModules().find<ModuleFE_BaseApi<any>>((module: DBModuleType) => module.dbDef?.dbName === moduleToUpdate.dbName);
			await this.performDeltaSync(module, moduleToUpdate.items);
		}

		this.syncedModules = response.modules.map(item => ({dbName: item.dbName, lastUpdated: item.lastUpdated}));
		dispatch_OnPermissibleModulesUpdated.dispatchUI();
		dispatch_onSyncCompleted.dispatchModule();
	};

	performFullSync = async (module: ModuleFE_BaseApi<any>) => {
		module.logInfo(`Full sync for: '${module.dbDef.dbName}'`);
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

		module.logDebug(`Full Sync Completed: ${module.dbDef.dbName}`);
	};

	performDeltaSync = async <T extends DB_Object>(module: ModuleFE_BaseApi<T>, syncData: Response_DBSync<T>) => {
		module.logInfo(`Delta sync for: '${module.dbDef.dbName}'`);

		module.logVerbose(`Firing event (DataStatus.UpdatingData): ${module.dbDef.dbName}`);
		module.setDataStatus(DataStatus.UpdatingData);

		await module.onEntriesUpdated(syncData.toUpdate ?? []);
		await module.onEntriesDeleted((syncData.toDelete ?? []) as T[]);

		module.logVerbose(`Firing event (DataStatus.ContainsData): ${module.dbDef.dbName}`);
		module.setDataStatus(DataStatus.ContainsData);

		module.logDebug(`Delta Sync Completed: ${module.dbDef.dbName}`);
	};

}

export const ModuleFE_SyncManagerV2 = new ModuleFE_SyncManagerV2_Class();
