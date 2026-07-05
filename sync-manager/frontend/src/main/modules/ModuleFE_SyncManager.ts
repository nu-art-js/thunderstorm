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
	Module,
	MUSTNeverHappenException,
	reduceToMap,
	removeFromArrayByIndex,
	removeItemFromArray,
	ResolvableContent,
	resolveContent,
	RuntimeModules,
	Second
} from '@nu-art/ts-common';
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
	SyncDbData,
	SyncManagerAPI_SmartSync
} from '@nu-art/sync-manager-shared';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {EventType_Query} from '@nu-art/db-api-shared';
import {DataStatus, ModuleFE_BaseApi, RuntimeFE_ModulesAPI} from '@nu-art/db-api-frontend';
import {DataSnapshot} from 'firebase/database';
import {QueueV2} from '@nu-art/ts-common/utils/queue-v2';
import {dispatch_QueryAwaitedModules, dispatch_onSyncStatusChanged} from '../components/AwaitModules/dispatchers.js';
import {ModuleFE_ConnectivityModule, OnConnectivityChange} from '@nu-art/thunder-ui-modules';
import {HttpClient, HttpRequest} from '@nu-art/http-client';
import {ModuleFE_FirebaseListener, RefListenerFE} from '@nu-art/firebase-frontend';


export interface PermissibleModulesUpdated {
	__onPermissibleModulesUpdated: () => void;
}

export const Default_SyncManagerNodePath = '/state/ModuleBE_SyncManager/syncData';

const dispatch_OnPermissibleModulesUpdated = new ThunderDispatcher<PermissibleModulesUpdated, '__onPermissibleModulesUpdated'>('__onPermissibleModulesUpdated');

export class ModuleFE_SyncManager_Class
	extends Module
	implements OnConnectivityChange {

	async __onConnectivityChange() {
		if (ModuleFE_ConnectivityModule.isConnected()) {
			this.logInfo(`Browser gained network connectivity- initiating smartSync.`);
			await this.debounceSyncImpl();
		} else {
			this.logWarningBold(`Browser lost network connectivity!`);
		}
	}

	// ######################### Class Properties #########################

	private syncedModules: SyncDbData[] = [];
	private readonly currentlySyncingModules: {
		module: ModuleFE_BaseApi<any>,
		syncId: string,
		request?: HttpRequest<any>
	}[] = [];
	private syncFirebaseListener?: RefListenerFE<SyncDataFirebaseState>;
	private outOfSyncCollections: Set<string> = new Set<string>();
	private syncing?: boolean;
	private pendingSync?: boolean;
	private cancelledSyncs: string[] = [];
	private cleanIDBOnFullSync: boolean = true;
	private syncManagerNodePath: ResolvableContent<string> = Default_SyncManagerNodePath;
	private smartSyncApiUrl: ResolvableContent<string | undefined>;
	private currentSyncData!: SyncDataFirebaseState;
	private _smartSyncCompleted?: (currentSyncData: SyncDataFirebaseState) => void;
	private _onSyncDataChanged?: (syncData?: SyncDataFirebaseState) => void;
	private _debounceTimeout: number = 2 * Second;
	private _debounceMaxTimeout: number = 10 * Second;

	private syncDebouncer?: VoidFunction;
	private syncQueue: QueueV2<NoNeedToSyncModule | DeltaSyncModule | FullSyncModule>;
	private excludedDbKeys: Set<string> = new Set<string>();

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
				const priorityModuleKeys: string[] = filterDuplicates(flatArray(dispatch_QueryAwaitedModules.dispatchUI())).map(module => module.config.dbKey);
				return priorityModuleKeys.includes(data.dbKey) ? 2 : 3;
			})
			.setOnQueueEmpty(this.clearSyncingStatus);
	}


	// ######################### Public Methods #########################

	public setShouldCleanIDBOnFullSync = (cleanIDBOnFullSync: boolean) => {
		this.cleanIDBOnFullSync = cleanIDBOnFullSync;
	};

	public excludeFromSync = (dbKey: string) => {
		this.excludedDbKeys.add(dbKey);
	};

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

	private getModulesToSync = () => RuntimeFE_ModulesAPI()
		.filter(m => !this.excludedDbKeys.has(m.config.dbKey));

	private getLocalSyncData = (): SyncDbData[] => {
		const existingDBModules = this.getModulesToSync();
		return existingDBModules.map(module => {
			const lastSync = module.IDB.getLastSync();
			return ({
				dbKey: module.config.dbKey,
				lastUpdated: lastSync
			});
		});
	};

	private smartSync = async () => {
		if (this.syncing) {
			this.pendingSync = true;
			return;
		}

		this.syncing = true;
		const request: SyncManagerAPI_SmartSync['request'] = {
			modules: this.getLocalSyncData()
		};

		const customBase = resolveContent(this.smartSyncApiUrl);
		const smartSyncDef = customBase
			? {...ApiDef_SyncManager.smartSync, fullUrl: customBase}
			: ApiDef_SyncManager.smartSync;

		try {
			const client = HttpClient.default;
			const req = client.createRequest(smartSyncDef as typeof ApiDef_SyncManager.smartSync).setBodyAsJson(request);
			const response = await req.execute();
			await this.onSmartSyncCompleted(response);
		} catch (e: any) {
			this.logError(e);
			this.syncing = false;
			this.pendingSync = false;
			return;
		}
	};

	private clearSyncingStatus = async () => {
		this.syncing = false;
		if (this.pendingSync) {
			delete this.pendingSync;
			await this.debounceSyncImpl();
		}
	};

	private async debounceSyncImpl() {
		if (exists(this.syncDebouncer))
			return this.syncDebouncer();

		this.syncDebouncer = debounce(async () => {
			if (!this.syncFirebaseListener)
				return this.logWarning('Ignoring sync data state, listener is undefined');

			this.logDebug(`Collections out of sync:`, this.outOfSyncCollections);
			this.outOfSyncCollections.clear();
			await this.smartSync();
		}, this._debounceTimeout, this._debounceMaxTimeout);

		this.logInfo('Performing Immediate Sync', '');
		await this.smartSync();
	}

	// ######################### onSmartSyncCompleted #########################

	/**
	 * Perform no sync, delta sync and full sync on modules. Intention is to get all modules to DataStatus "ContainsData".
	 */
	public onSmartSyncCompleted = async (response: SyncManagerAPI_SmartSync['response']) => {
		this.logDebug(JSON.stringify({
			event: 'sync.smart-sync/completed',
			moduleCount: response.modules.length,
			modules: response.modules.map(module => ({dbKey: module.dbKey, sync: module.sync})),
		}));

		this._smartSyncCompleted?.(this.currentSyncData);

		const currentSyncedModulesLength = this.syncedModules.length;
		this.syncedModules = response.modules.map(item => ({dbKey: item.dbKey, lastUpdated: item.lastUpdated}));
		response.modules.forEach(module => this.syncQueue.addItem(module));
		this.syncQueue.executeSync();

		if (currentSyncedModulesLength !== response.modules.length)
			dispatch_OnPermissibleModulesUpdated.dispatchUI();
	};

	// ######################### Sync operations #########################

	private performSync = (data: NoNeedToSyncModule | DeltaSyncModule | FullSyncModule) => {
		const rtModule = RuntimeModules().find<ModuleFE_BaseApi<any>>(rtModule => rtModule.config?.dbKey === data.dbKey);
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
		const rtModule = RuntimeModules().find<ModuleFE_BaseApi<any>>(rtModule => rtModule.config?.dbKey === data.dbKey);
		if (!rtModule)
			throw new MUSTNeverHappenException(`Trying perform NoSync without an existing rtModule: ${data.dbKey}`);

		if (rtModule.getDataStatus() === DataStatus.ContainsData && rtModule.cache.all().length > 0) {
			void rtModule.logCacheState('sync.no-sync/skipped-already-contains-data');
			return;
		}

		if (rtModule.getDataStatus() === DataStatus.ContainsData)
			rtModule.logWarning(`REJECTED: ContainsData with empty MemCache — reloading from IDB (${rtModule.config.dbKey})`);

		this.currentlySyncingModules.push({module: rtModule, syncId: this.generateSyncRequestId()});

		this.logVerbose(`Performing NoSyncOperation for module ${rtModule.getName()}`);
		this.logVerbose(`No sync for: ${rtModule.config.dbKey}, Already UpToDate.`);

		try {
			rtModule.logVerbose(`Updating Cache: ${rtModule.config.dbKey}`);
			await rtModule.loadCache();
			await rtModule.logCacheState('sync.no-sync/mark-contains-data');
			rtModule.logVerbose(`Firing event (DataStatus.ContainsData): ${rtModule.config.dbKey}`);
			rtModule.setDataStatus(DataStatus.ContainsData);
			dispatch_onSyncStatusChanged.dispatchUI(rtModule);
		} catch (e: any) {
			this.logError(e);
		} finally {
			const indexOfModuleToRemove = this.currentlySyncingModules.findIndex(module => module.module.config?.dbKey === data.dbKey);
			removeFromArrayByIndex(this.currentlySyncingModules, indexOfModuleToRemove);
		}
	};

	private performDeltaSync = async (data: DeltaSyncModule) => {
		const rtModule = RuntimeModules().find<ModuleFE_BaseApi<any>>(rtModule => rtModule.config?.dbKey === data.dbKey);
		if (!rtModule)
			throw new MUSTNeverHappenException(`Trying perform DeltaSync without an existing rtModule: ${data.dbKey}`);

		this.logDebug(`Performing DeltaSyncOperation for module ${rtModule.getName()}`);
		try {
			this.currentlySyncingModules.push({module: rtModule, syncId: this.generateSyncRequestId()});
			rtModule.logVerbose(`Firing event (DataStatus.UpdatingData): ${rtModule.config.dbKey}`);
			rtModule.setDataStatus(DataStatus.UpdatingData);
			dispatch_onSyncStatusChanged.dispatchUI(rtModule);
			if (data.items.toUpdate.length)
				await rtModule.onEntriesUpdated(data.items.toUpdate);

			if (data.items.toDelete.length)
				await rtModule.onEntriesDeleted((data.items.toDelete));

			rtModule.IDB.setLastUpdated(data.lastUpdated);

			this.logDebug(`Delta Sync Completed: ${rtModule.config.dbKey}`);
			await rtModule.loadCache();
			await rtModule.logCacheState('sync.delta-sync/mark-contains-data', {
				toUpdateCount: data.items.toUpdate.length,
				toDeleteCount: data.items.toDelete.length,
			});
			rtModule.setDataStatus(DataStatus.ContainsData);
			dispatch_onSyncStatusChanged.dispatchUI(rtModule);
		} catch (e: any) {
			this.logError(e);
		} finally {
			const indexOfModuleToRemove = this.currentlySyncingModules.findIndex(module => module.module.config?.dbKey === data.dbKey);
			removeFromArrayByIndex(this.currentlySyncingModules, indexOfModuleToRemove);
		}
	};

	private performFullSync = async (data: FullSyncModule) => {
		const rtModule = RuntimeModules().find<ModuleFE_BaseApi<any>>(rtModule => rtModule.config?.dbKey === data.dbKey);
		if (!rtModule)
			throw new MUSTNeverHappenException(`Trying perform FullSync without an existing rtModule: ${data.dbKey}`);

		this.logDebug(`Performing FullSyncOperation for module ${rtModule.getName()}`);
		const syncId = this.generateSyncRequestId();
		this.currentlySyncingModules.push({module: rtModule, syncId: syncId});
		try {
			const dataStatusBeforeClear = rtModule.getDataStatus();
			rtModule.logVerbose(`Firing event (DataStatus.UpdatingData): ${rtModule.config.dbKey}`);
			rtModule.setDataStatus(DataStatus.UpdatingData);
			dispatch_onSyncStatusChanged.dispatchUI(rtModule);

			if (this.cleanIDBOnFullSync) {
				rtModule.logVerbose(`Cleaning IDB: ${rtModule.config.dbKey}`);
				await rtModule.IDB.clearAll();
			}
			rtModule.logVerbose(`Cleaning Cache: ${rtModule.config.dbKey}`);
			rtModule.cache.clear();
			void rtModule.logCacheState('sync.full-sync/cache-cleared', {
				dataStatusBeforeClear: DataStatus[dataStatusBeforeClear],
			});

			rtModule.logVerbose(`Syncing: ${rtModule.config.dbKey}`);
			let allItems;
			try {
				if (this.cancelledSyncs.includes(syncId)) {
					this.removeFromCancelledSyncs(syncId);
					return;
				}

				const baseHttpRequest = rtModule.query({where: {}});

				const indexOfModuleToUpdate = this.currentlySyncingModules.findIndex(module => module.module.config?.dbKey === data.dbKey);
				this.currentlySyncingModules[indexOfModuleToUpdate].request = baseHttpRequest as unknown as HttpRequest<any>;

				allItems = await baseHttpRequest;
			} catch (e: any) {
				if (this.cancelledSyncs.includes(syncId)) {
					this.removeFromCancelledSyncs(syncId);
					return;
				}

				throw e;
			}

			rtModule.logVerbose(`Updating IDB: ${rtModule.config.dbKey}`);
			if (this.cancelledSyncs.includes(syncId)) {
				this.removeFromCancelledSyncs(syncId);
				return;
			}
			await rtModule.IDB.syncIndexDb(allItems);
			rtModule.IDB.setLastUpdated(data.lastUpdated);
			await rtModule.logCacheState('sync.full-sync/idb-written', {apiItemCount: allItems.length});
			rtModule.logVerbose(`Updating Cache: ${rtModule.config.dbKey}`);
			rtModule.logVerbose(`allItems length ${allItems.length}`);
			await rtModule.loadCache();
			rtModule.logVerbose(`IDB items length ${(await rtModule.IDB.getAll()).length}`);
			rtModule.logVerbose(`cache items length ${rtModule.cache.all().length}`);

			rtModule.logVerbose(`Firing event (DataStatus.ContainsData): ${rtModule.config.dbKey}`);
			rtModule.setDataStatus(DataStatus.ContainsData);
			dispatch_onSyncStatusChanged.dispatchUI(rtModule);

			rtModule.logVerbose(`Firing event (EventType_Query): ${rtModule.config.dbKey}`);

			this.logDebug(`Full Sync Completed: ${rtModule.config.dbKey}`);
			if (allItems.length === 0)
				return;

			rtModule.dispatcher(EventType_Query, allItems);

		} catch (e: any) {
			this.logError(`Error while syncing collection '${rtModule.config.dbKey}'`, e);
			throw e;
		} finally {
			const indexOfModuleToRemove = this.currentlySyncingModules.findIndex(module => module.module.config?.dbKey === data.dbKey);
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
		const nodePath = resolveContent(this.syncManagerNodePath);

		if (this.syncFirebaseListener) {
			this.logWarning(`Trying to start listening on --- ${nodePath} --- but the listener already exists.`);
			return;
		}

		this.syncFirebaseListener = ModuleFE_FirebaseListener
			.createListener(nodePath)
			.startListening(this.onSyncDataChanged);
	}

	public stopListening() {
		this.logDebug(`Stop listening on ${resolveContent(this.syncManagerNodePath)}`);
		this.syncFirebaseListener?.stopListening();
		this.syncFirebaseListener = undefined;
		delete this.syncDebouncer;
	}

	private onSyncDataChanged = async (snapshot: DataSnapshot) => {
		this.logDebug('Received firebase state data');

		const rtdbSyncData = snapshot.val() as SyncDataFirebaseState | undefined;

		this._onSyncDataChanged?.(rtdbSyncData);

		if (!rtdbSyncData)
			return await this.debounceSyncImpl();

		this.currentSyncData = rtdbSyncData;

		const localSyncData = reduceToMap<SyncDbData, LastUpdated>(this.getLocalSyncData(), data => data.dbKey, data => ({lastUpdated: data.lastUpdated}));
		(_keys(rtdbSyncData) as string[]).forEach((dbKey) => {
			if (!localSyncData[dbKey])
				return;

			if (rtdbSyncData[dbKey].lastUpdated <= localSyncData[dbKey].lastUpdated)
				return;

			this.outOfSyncCollections.add(dbKey);
		});

		return await this.debounceSyncImpl();
	};

	// ######################### setNodeContext #########################

	public setNodeContext = (nodeContextResolver: ResolvableContent<string>) => this.syncManagerNodePath = nodeContextResolver;

	public setSmartSyncUrl = (baseUrlResolver: ResolvableContent<string | undefined>) => this.smartSyncApiUrl = baseUrlResolver;

	public setOnSyncCompleted = (smartSyncCompleted: (syncData: SyncDataFirebaseState) => void) => this._smartSyncCompleted = smartSyncCompleted;

	public setOnSyncDataChanged = (onSyncDataChanged: (syncData?: SyncDataFirebaseState) => void) => this._onSyncDataChanged = onSyncDataChanged;

	public setDebounceTimeout = (debounceTimeout: number) => this._debounceTimeout = debounceTimeout;

	public setDebounceMaxTimeout = (debounceTimeout: number) => this._debounceMaxTimeout = debounceTimeout;
}

export const ModuleFE_SyncManager = new ModuleFE_SyncManager_Class();
