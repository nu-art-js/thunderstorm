/*
 * @nu-art/sync-manager-frontend - Sync manager frontend client (smartSync API)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {debounce, exists, LogLevel, Module} from '@nu-art/ts-common';
import {HttpClient} from '@nu-art/http-client';
import {ApiDef_SyncManager, SyncDbData, SyncManagerAPI_SmartSync} from '@nu-art/sync-manager-shared';

export type SyncManagerFEConfig = {
	getLocalSyncData: () => SyncDbData[] | Promise<SyncDbData[]>;
	onSmartSyncCompleted: (response: SyncManagerAPI_SmartSync['response']) => void | Promise<void>;
	/** Optional: app calls this with a function to invoke when connectivity is restored (e.g. call the passed triggerSync) */
	onConnectivityRestored?: (triggerSync: () => void) => void;
};

/**
 * Frontend sync client: calls smartSync API and passes the response to onSmartSyncCompleted.
 * The app (or an adapter using db-api-frontend) applies delta/full/no sync per module.
 */
export class ModuleFE_SyncManager_Class extends Module {

	private getLocalSyncData!: () => SyncDbData[] | Promise<SyncDbData[]>;
	private onSmartSyncCompleted!: (response: SyncManagerAPI_SmartSync['response']) => void | Promise<void>;
	private smartSyncApiBaseUrl?: string;
	private syncing = false;
	private pendingSync = false;
	private debouncedSync?: () => void;

	constructor(config: SyncManagerFEConfig) {
		super();
		this.setMinLevel(LogLevel.Verbose);
		this.getLocalSyncData = config.getLocalSyncData;
		this.onSmartSyncCompleted = config.onSmartSyncCompleted;
		if (config.onConnectivityRestored)
			config.onConnectivityRestored(() => { void this.smartSync(); });
	}

	setBaseUrl(url: string | undefined): this {
		this.smartSyncApiBaseUrl = url;
		return this;
	}

	/**
	 * Call smartSync API and pass response to onSmartSyncCompleted.
	 * If a sync is already in progress, a follow-up sync will run when it finishes.
	 */
	readonly smartSync = async (): Promise<void> => {
		if (this.syncing) {
			this.pendingSync = true;
			return;
		}
		this.syncing = true;
		const localData = await this.getLocalSyncData();
		const request: SyncManagerAPI_SmartSync['request'] = {modules: localData};
		const client = HttpClient.default ?? new HttpClient();
		const apiDef = ApiDef_SyncManager.v1.smartSync;
		const effectiveDef = this.smartSyncApiBaseUrl
			? {...apiDef, baseUrl: this.smartSyncApiBaseUrl}
			: apiDef;
		try {
			const requestObj = client.createRequest(effectiveDef).setBodyAsJson(request);
			const response = await requestObj.execute();
			await this.onSmartSyncCompleted(response);
		} catch (e: unknown) {
			this.logError(e as Error);
		} finally {
			this.syncing = false;
			if (this.pendingSync) {
				this.pendingSync = false;
				await this.smartSync();
			}
		}
	};

	/**
	 * Debounced sync: multiple calls within the window result in a single sync after the delay.
	 */
	readonly smartSyncDebounced = (delayMs = 2000, maxDelayMs = 10000): (() => void) => {
		if (exists(this.debouncedSync))
			return this.debouncedSync;
		this.debouncedSync = debounce(() => { void this.smartSync(); }, delayMs, maxDelayMs);
		return this.debouncedSync;
	};
}
