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

import {
	_keys,
	BadImplementationException,
	debounce,
	exists,
	filterDuplicates,
	flatArray,
	generateHex,
	LogLevel,
	Module,
	MUSTNeverHappenException,
	reduceToMap,
	removeFromArrayByIndex,
	removeItemFromArray,
	RuntimeModules,
	Second
} from '@nu-art/ts-common';
import {apiWithBody} from '../../core/typed-api';
import {
	ApiStruct_SyncManager,
	DeltaSyncModule,
	FullSyncModule,
	LastUpdated,
	NoNeedToSyncModule,
	Request_SmartSync,
	Response_SmartSync,
	SmartSync_DeltaSync,
	SmartSync_FullSync,
	SmartSync_UpToDateSync,
	SyncDataFirebaseState,
	SyncDbData
} from '../../../shared/sync-manager/types';
import {ThunderDispatcher} from '../../core/thunder-dispatcher';
import {DataStatus, EventType_Query} from '../../core/db-api-gen/consts';
import {ModuleFE_FirebaseListener, RefListenerFE} from '@nu-art/firebase/frontend/ModuleFE_FirebaseListener/ModuleFE_FirebaseListener';
import {DataSnapshot} from 'firebase/database';
import {QueueV2} from '@nu-art/ts-common/utils/queue-v2';
import {dispatch_QueryAwaitedModules} from '../../components/AwaitModules/AwaitModules';
import {ModuleFE_ConnectivityModule, OnConnectivityChange} from '../ModuleFE_ConnectivityModule';
import {ApiDefCaller, BodyApi, HttpMethod} from '../../../shared/types';
import {ModuleFE_BaseApi} from '../db-api-gen/ModuleFE_BaseApi';
import {ModuleSyncType} from '../db-api-gen/types';
import {BaseHttpRequest} from '../../../shared';


export interface PermissibleModulesUpdated {
	__onPermissibleModulesUpdated: () => void;
}

const Default_SyncManagerNodePath = '/state/ModuleBE_SyncManager/syncData'; // Hardcoded path for now per Adam's request, should be const somewhere.

const dispatch_OnPermissibleModulesUpdated = new ThunderDispatcher<PermissibleModulesUpdated, '__onPermissibleModulesUpdated'>('__onPermissibleModulesUpdated');

export class ModuleFE_SyncManager_Class
	extends Module
	implements ApiDefCaller<ApiStruct_SyncManager>, OnConnectivityChange {

	async __onConnectivityChange() {
		if (ModuleFE_ConnectivityModule.isConnected()) {
			this.logInfo(`Browser gained network connectivity- initiating smartSync.`);
			await this.debounceSyncImpl();
		} else {
			this.logWarningBold(`Browser lost network connectivity!`);
		}
	}

	// ######################### Class Properties #########################

	// All the modules that a user has permissions to view and with the last updated timestamp of each collection
	private syncedModules: SyncDbData[] = [];
	private readonly currentlySyncingModules: { module: ModuleFE_BaseApi<any>, syncId: string, request?: BaseHttpRequest<any> }[] = [];
	private syncFirebaseListener?: RefListenerFE<SyncDataFirebaseState>;
	private outOfSyncCollections: Set<string> = new Set<string>();
	private syncing?: boolean;
	private pendingSync?: boolean;
	private cancelledSyncs: string[] = [];

	private syncDebouncer?: VoidFunction;
	private syncQueue: QueueV2<NoNeedToSyncModule | DeltaSyncModule | FullSyncModule>;

	constructor() {
		super();
		this.syncQueue = new QueueV2<NoNeedToSyncModule | DeltaSyncModule | FullSyncModule>('Sync Queue', this.performSync)
			.setParallelCount(4)
			.setSorter(data => {
				if (data.sync === SmartSync_UpToDateSync)
					return 0;

				if (data.sync === SmartSync_DeltaSync)
					return 1;

				//Is full sync
				const priorityModuleKeys: string[] = filterDuplicates(flatArray(dispatch_QueryAwaitedModules.dispatchUI())).map(module => module.dbDef.dbKey);
				return priorityModuleKeys.includes(data.dbKey) ? 2 : 3;
			})
			.setOnQueueEmpty(this.clearSyncingStatus);
		this.setMinLevel(LogLevel.Debug);
	}

	// ######################### Public Methods #########################

	public getPermissibleModuleNames = () => this.syncedModules.map(moduleSyncData => moduleSyncData.dbKey);

	public getCurrentlySyncingModules = () => this.currentlySyncingModules.map(module => module.module);

	public cancelSync = () => {
		this.cancelledSyncs = this.currentlySyncingModules.map(module => {
			module.request?.abort();
			return module.syncId;
		});
		this.currentlySyncingModules.splice(0, this.currentlySyncingModules.length);
		this.syncing = false;
		this.pendingSync = false;
		this.syncQueue.cancelAll();
	};

	// ######################### Smart Sync #########################

	private getModulesToSync = () => RuntimeModules().filter<ModuleFE_BaseApi<any>>((module) => module.syncType === ModuleSyncType.APISync);

	private getLocalSyncData = (): SyncDbData[] => {
		const existingDBModules = this.getModulesToSync();
		return existingDBModules.map(module => {
			const lastSync = module.IDB.getLastSync();
			return ({
				dbKey: module.dbDef.dbKey,
				lastUpdated: lastSync
			});
		});
	};

	private smartSync = async () => {
		//If syncing currently, flag pending sync and return
		if (this.syncing) {
			this.pendingSync = true;
			return;
		}

		this.syncing = true;
		const request: Request_SmartSync = {
			modules: this.getLocalSyncData()
		};

		// implement the smart sync call internal so no one will initiate it from the anywhere in the code, except this module
		await apiWithBody<BodyApi<Response_SmartSync, Request_SmartSync>>({
			method: HttpMethod.POST,
			path: 'v3/db-api/smart-sync',
			timeout: 60 * Second
		}, this.onSmartSyncCompleted)(request).executeSync();

		// //If queue is empty
		// if (!this.syncQueue.getLength())
		// 	await this.clearSyncingStatus();
	};

	private clearSyncingStatus = async () => {
		//Un-flag currently syncing
		this.syncing = false;
		//If a sync is pending
		if (this.pendingSync) {
			delete this.pendingSync;
			await this.debounceSyncImpl();
		}
	};

	private async debounceSyncImpl() {
		// Everytime after the first, we'll have the debounceSync const ready, amd debounce the call.
		if (exists(this.syncDebouncer))
			return this.syncDebouncer();

		// Since RTDB event arrives upon start listening we would like to perform a first sync immediately,
		// therefore we call sync directly for the first event and create the debounce function right after for all the consecutive events
		this.syncDebouncer = debounce(async () => {
			if (!this.syncFirebaseListener)
				return this.logWarning('Ignoring sync data state, listener is undefined');

			this.logDebug(`Collections out of sync:`, this.outOfSyncCollections);
			this.outOfSyncCollections.clear();
			await this.smartSync();
		}, 2000, 10000);

		this.logInfo('Performing Immediate Sync');
		await this.smartSync();
	}

	// ######################### onSmartSyncCompleted #########################

	/**
	 * Perform no sync, delta sync and full sync on modules. Intention is to get all modules to DataStatus "ContainsData".
	 */
	public onSmartSyncCompleted = async (response: Response_SmartSync) => {
		this.logInfo(`onSmartSyncCompleted (${response.modules.length})`, response);
		const currentSyncedModulesLength = this.syncedModules.length;
		this.syncedModules = response.modules.map(item => ({dbKey: item.dbKey, lastUpdated: item.lastUpdated}));
		response.modules.forEach(module => this.syncQueue.addItem(module));
		//Start off the syncing
		this.syncQueue.executeSync();

		if (currentSyncedModulesLength !== response.modules.length)
			dispatch_OnPermissibleModulesUpdated.dispatchUI();
	};

	// ######################### Sync operations #########################

	private performSync = (data: NoNeedToSyncModule | DeltaSyncModule | FullSyncModule) => {
		const rtModule = RuntimeModules().find<ModuleFE_BaseApi<any>>(rtModule => rtModule.dbDef?.dbKey === data.dbKey);
		if (!rtModule)
			throw new MUSTNeverHappenException(`Trying to queue a module to sync without an existing rtModule: ${data.dbKey}`);

		switch (data.sync) {
			case SmartSync_UpToDateSync:
				return this.performNoSync(data);

			case SmartSync_DeltaSync:
				return this.performDeltaSync(data);

			case SmartSync_FullSync:
				return this.performFullSync(data);

			default:
				// @ts-ignore
				throw new BadImplementationException(`No handling for sync key ${data.sync}`);
		}
	};

	private performNoSync = async (data: NoNeedToSyncModule) => {
		const rtModule = RuntimeModules().find<ModuleFE_BaseApi<any>>(rtModule => rtModule.dbDef?.dbKey === data.dbKey);
		if (!rtModule)
			throw new MUSTNeverHappenException(`Trying perform NoSync without an existing rtModule: ${data.dbKey}`);

		//If the cache is already loaded no need to reload
		if (rtModule.getDataStatus() === DataStatus.ContainsData)
			return;

		this.currentlySyncingModules.push({module: rtModule, syncId: this.generateSyncRequestId()});

		this.logVerbose(`Performing NoSyncOperation for module ${rtModule.getName()}`);
		this.logVerbose(`No sync for: ${rtModule.dbDef.dbKey}, Already UpToDate.`);

		try {
			rtModule.logVerbose(`Updating Cache: ${rtModule.dbDef.dbKey}`);
			await rtModule.cache.load();
			rtModule.logVerbose(`Firing event (DataStatus.ContainsData): ${rtModule.dbDef.dbKey}`);
			rtModule.setDataStatus(DataStatus.ContainsData);
		} catch (e: any) {
			this.logError(e);
		} finally {
			const indexOfModuleToRemove = this.currentlySyncingModules.findIndex(module => module.module.dbDef?.dbKey === data.dbKey);
			removeFromArrayByIndex(this.currentlySyncingModules, indexOfModuleToRemove);
		}
	};

	private performDeltaSync = async (data: DeltaSyncModule) => {
		const rtModule = RuntimeModules().find<ModuleFE_BaseApi<any>>(rtModule => rtModule.dbDef?.dbKey === data.dbKey);
		if (!rtModule)
			throw new MUSTNeverHappenException(`Trying perform DeltaSync without an existing rtModule: ${data.dbKey}`);

		this.logDebug(`Performing DeltaSyncOperation for module ${rtModule.getName()}`);
		try {
			this.currentlySyncingModules.push({module: rtModule, syncId: this.generateSyncRequestId()});
			rtModule.logVerbose(`Firing event (DataStatus.UpdatingData): ${rtModule.dbDef.dbKey}`);
			rtModule.setDataStatus(DataStatus.UpdatingData);
			if (data.items.toUpdate.length)
				await rtModule.onEntriesUpdated(data.items.toUpdate);

			if (data.items.toDelete.length)
				await rtModule.onEntriesDeleted((data.items.toDelete));

			rtModule.IDB.setLastUpdated(data.lastUpdated);

			this.logDebug(`Delta Sync Completed: ${rtModule.dbDef.dbKey}`);
			rtModule.setDataStatus(DataStatus.ContainsData);
		} catch (e: any) {
			this.logError(e);
		} finally {
			const indexOfModuleToRemove = this.currentlySyncingModules.findIndex(module => module.module.dbDef?.dbKey === data.dbKey);
			removeFromArrayByIndex(this.currentlySyncingModules, indexOfModuleToRemove);
		}
	};

	private performFullSync = async (data: FullSyncModule) => {
		const rtModule = RuntimeModules().find<ModuleFE_BaseApi<any>>(rtModule => rtModule.dbDef?.dbKey === data.dbKey);
		if (!rtModule)
			throw new MUSTNeverHappenException(`Trying perform DeltaSync without an existing rtModule: ${data.dbKey}`);

		this.logDebug(`Performing FullSyncOperation for module ${rtModule.getName()}`);
		const syncId = this.generateSyncRequestId();
		this.currentlySyncingModules.push({module: rtModule, syncId: syncId});
		try {
			// if the backend have decided module collection needs a full sync, we need to clean local idb and cache
			rtModule.logVerbose(`Cleaning IDB: ${rtModule.dbDef.dbKey}`);
			await rtModule.IDB.clear(); // Also sets the module's data status to NoData.
			rtModule.logVerbose(`Cleaning Cache: ${rtModule.dbDef.dbKey}`);
			rtModule.cache.clear();

			// for full sync go fetch all db items
			rtModule.logVerbose(`Syncing: ${rtModule.dbDef.dbKey}`);
			let allItems;
			try {
				if (this.cancelledSyncs.includes(syncId)) {
					this.removeFromCancelledSyncs(syncId);
					return;
				}

				const baseHttpRequest = rtModule.v1.query({where: {}});

				const indexOfModuleToUpdate = this.currentlySyncingModules.findIndex(module => module.module.dbDef?.dbKey === data.dbKey);
				this.currentlySyncingModules[indexOfModuleToUpdate].request = baseHttpRequest;

				allItems = await baseHttpRequest.executeSync();
			} catch (e: any) {
				if (this.cancelledSyncs.includes(syncId)) {
					this.removeFromCancelledSyncs(syncId);
					return;
				}

				throw e;
			}

			rtModule.logVerbose(`Updating IDB: ${rtModule.dbDef.dbKey}`);
			if (this.cancelledSyncs.includes(syncId)) {
				this.removeFromCancelledSyncs(syncId);
				return;
			}
			await rtModule.IDB.syncIndexDb(allItems);
			rtModule.IDB.setLastUpdated(data.lastUpdated);
			rtModule.logVerbose(`Updating Cache: ${rtModule.dbDef.dbKey}`);
			rtModule.logVerbose(`allItems length ${allItems.length}`);
			await rtModule.cache.load();
			rtModule.logVerbose(`IDB items length ${(await rtModule.IDB.query()).length}`);
			rtModule.logVerbose(`cache items length ${rtModule.cache.all().length}`);

			rtModule.logVerbose(`Firing event (DataStatus.ContainsData): ${rtModule.dbDef.dbKey}`);
			rtModule.setDataStatus(DataStatus.ContainsData);

			rtModule.logVerbose(`Firing event (EventType_Query): ${rtModule.dbDef.dbKey}`);

			this.logDebug(`Full Sync Completed: ${rtModule.dbDef.dbKey}`);
			if (allItems.length === 0)
				return;

			rtModule.dispatchMulti(EventType_Query, allItems);

		} catch (e: any) {
			this.logError(`Error while syncing ${rtModule.dbDef.dbKey}`, e);
			throw e;
		} finally {
			const indexOfModuleToRemove = this.currentlySyncingModules.findIndex(module => module.module.dbDef?.dbKey === data.dbKey);
			removeFromArrayByIndex(this.currentlySyncingModules, indexOfModuleToRemove);
		}
	};

	private generateSyncRequestId = () => {
		return generateHex(12);
	};

	private removeFromCancelledSyncs = (syncId: string) => {
		if (!syncId) {
			this.logError(`ID ${syncId} doesn't exist in cancelledSyncs, redundant attempt to remove it.`);
			return;
		}
		removeItemFromArray(this.cancelledSyncs, syncId);
	};

	// ######################### Listening #########################

	public startListening() {
		// Hardcoded path for now per Adam's request, should be const somewhere.
		this.syncFirebaseListener = ModuleFE_FirebaseListener
			.createListener(Default_SyncManagerNodePath)
			.startListening(this.onSyncDataChanged);
	}

	public stopListening() {
		this.logDebug(`Stop listening on ${Default_SyncManagerNodePath}`);
		this.syncFirebaseListener?.stopListening();
		this.syncFirebaseListener = undefined;
		delete this.syncDebouncer;
	}

	private onSyncDataChanged = async (snapshot: DataSnapshot) => {
		this.logDebug('Received firebase state data');

		// remoteSyncData is the data we received from the firebase listener, that just detected a change.
		const rtdbSyncData = snapshot.val() as SyncDataFirebaseState | undefined;

		if (!rtdbSyncData)
			return await this.debounceSyncImpl();

		// localSyncData is the data we just collected from the IDB regarding all existing modules.
		const localSyncData = reduceToMap<SyncDbData, LastUpdated>(this.getLocalSyncData(), data => data.dbKey, data => ({lastUpdated: data.lastUpdated}));
		(_keys(rtdbSyncData) as string[]).forEach((dbKey) => {
			// this Should be taken care of by the below condition because both local and remote will return last updated 0
			// if (!exists(this.remoteSyncData[dbKey]))
			// 	return;

			if (!localSyncData[dbKey])
				return;

			if (rtdbSyncData[dbKey].lastUpdated <= localSyncData[dbKey].lastUpdated)
				return;

			this.outOfSyncCollections.add(dbKey);
		});

		//todo This fixed the issue when we received delta sync and not up-to-date, see if this code can go
		// // If there are no changes, just set all modules' data status to ContainsData
		// if (this.outOfSyncCollections.size === 0) {
		// 	// on sync completed
		// 	const allModulesAreUpToDate: NoNeedToSyncModule[] = (_keys(localSyncData) as string[]).map(dbKey =>
		// 		({
		// 			dbKey: dbKey,
		// 			lastUpdated: localSyncData[dbKey]?.lastUpdated ?? 0,
		// 			sync: SmartSync_UpToDateSync
		// 		}));
		// 	const setAllModulesAsContainData: Response_SmartSync = {modules: allModulesAreUpToDate};
		// 	await this.onSmartSyncCompleted(setAllModulesAsContainData);
		// }
		// If there are changes, call sync
		return await this.debounceSyncImpl();
	};
}

export const ModuleFE_SyncManager = new ModuleFE_SyncManager_Class();
