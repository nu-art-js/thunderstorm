/*
 * @nu-art/sync-env-backend - Sync env backend module
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {arrayToMap, BadImplementationException, Dispatcher, Minute, Module, MUSTNeverHappenException, TypedMap} from '@nu-art/ts-common';
import {HttpCodes} from '@nu-art/api-types';
import {ModuleBE_Firebase} from '@nu-art/firebase-backend';
import {Transform, Writable} from 'stream';
import {firestore} from 'firebase-admin';
import {ApiDef_SyncEnv, Request_GetMetadata, type ApiStruct_SyncEnv} from '@nu-art/sync-env-shared';
import {HttpMethod} from '@nu-art/api-types';
import {ApiHandler} from '@nu-art/http-server';
import {HttpClient} from '@nu-art/http-client';
import type {BackupProvider, GetUpsertAllApi, SyncEnvBackendConfig, SyncEnvBackupInfo, SyncEnvDBRegistry} from './types.js';

export interface OnSyncEnvCompleted {
	__onSyncEnvCompleted: (env: string, baseUrl: string, requiredHeaders: TypedMap<string>) => void | Promise<void>;
}

export const dispatch_OnSyncEnvCompleted = new Dispatcher<OnSyncEnvCompleted, '__onSyncEnvCompleted'>(
	'__onSyncEnvCompleted');

export type SyncEnvBackendDeps = {
	config: SyncEnvBackendConfig;
	backupProvider: BackupProvider;
	dbRegistry: SyncEnvDBRegistry;
	getRequestAuthHeader: () => string | undefined;
	httpClient: HttpClient;
	getUpsertAllApi: GetUpsertAllApi;
};

class SyncCollectionFilter
	extends Transform {

	readonly allowedDbKeys: string[];

	constructor(allowedDbKeys: string[]) {
		super({objectMode: true});
		this.allowedDbKeys = allowedDbKeys;
	}

	_transform(chunk: unknown, _encoding: string, callback: (error?: Error | null) => void) {
		const c = chunk as { dbKey?: string };
		if (c?.dbKey && this.allowedDbKeys.includes(c.dbKey))
			this.push(chunk);
		callback();
	}
}

function createCollectionBatchWriter(
	paginationSize: number,
	modulesMap: TypedMap<{ dbKey: string; collectionName: string }>,
	logWarning: (msg: string) => void
): Writable {
	const firebaseSessionAdmin = ModuleBE_Firebase.createAdminSession();
	const firestoreDb = firebaseSessionAdmin.getFirestore().firestore;

	return new class CollectionBatchWriter
		extends Writable {

		private itemCount = 0;
		private batchWriter: firestore.WriteBatch = firestoreDb.batch();

		constructor() {
			super({objectMode: true});
		}

		async _write(chunk: unknown, _encoding: string, callback: (error?: Error | null) => void) {
			try {
				const c = chunk as { dbKey?: string; _id?: string; document?: string };
				const module = c?.dbKey ? modulesMap[c.dbKey] : undefined;
				if (!module) {
					logWarning(`Could not get module for chunk with dbKey ${c?.dbKey}`);
					callback();
					return;
				}
				const collectionName = module.collectionName;
				const docRef = firestoreDb.doc(`${collectionName}/${c._id}`);
				const data = JSON.parse(c.document ?? '{}');
				this.batchWriter.set(docRef, data);
				this.itemCount++;

				if (this.itemCount === paginationSize) {
					const prevBatch = this.batchWriter;
					this.batchWriter = firestoreDb.batch();
					this.itemCount = 0;
					await prevBatch.commit();
				}
				callback();
			} catch (error) {
				callback(error instanceof Error ? error : new Error(String(error)));
			}
		}

		async _final(callback: (error?: Error | null) => void) {
			try {
				await this.batchWriter.commit();
				callback();
			} catch (err) {
				callback(err instanceof Error ? err : new Error(String(err)));
			}
		}
	}();
}

export class ModuleBE_SyncEnv_Class
	extends Module {

	private readonly syncEnvConfig: SyncEnvBackendConfig;
	private readonly backupProvider: BackupProvider;
	private readonly dbRegistry: SyncEnvDBRegistry;
	private readonly getRequestAuthHeader: () => string | undefined;
	private readonly httpClient: HttpClient;
	private readonly getUpsertAllApi: GetUpsertAllApi;

	constructor(deps: SyncEnvBackendDeps) {
		super();
		this.syncEnvConfig = deps.config;
		this.backupProvider = deps.backupProvider;
		this.dbRegistry = deps.dbRegistry;
		this.getRequestAuthHeader = deps.getRequestAuthHeader;
		this.httpClient = deps.httpClient;
		this.getUpsertAllApi = deps.getUpsertAllApi;
		this.setDefaultConfig({maxBatch: 500});
	}

	private async getBackupInfo(queryParams: Request_GetMetadata): Promise<SyncEnvBackupInfo> {
		const {backupId, env} = queryParams;
		if (!env)
			throw new BadImplementationException('Did not receive env in the fetch from env api call!');
		const url = this.syncEnvConfig.urlMap[env];
		const session = this.syncEnvConfig.sessionMap[env];
		if (!url || !session)
			throw new BadImplementationException(`No urlMap/sessionMap for env: ${env}`);
		return this.backupProvider.getBackupInfo(backupId, url, session);
	}

	@ApiHandler(ApiDef_SyncEnv.vv1.fetchBackupMetadata)
	async fetchBackupMetadata(queryParams: ApiStruct_SyncEnv['vv1']['fetchBackupMetadata']['Params']): Promise<ApiStruct_SyncEnv['vv1']['fetchBackupMetadata']['Response']> {
		const backupInfo = await this.getBackupInfo(queryParams);
		if (!backupInfo)
			throw HttpCodes._4XX.NOT_FOUND('backup file not found');
		if (!backupInfo.metadata)
			throw HttpCodes._4XX.NOT_FOUND('No metadata found on this backup');
		const remoteCollectionNames = this.dbRegistry.getModuleEntries().map(e => e.dbKey);
		return {
			...backupInfo.metadata,
			remoteCollectionNames
		};
	}

	@ApiHandler(ApiDef_SyncEnv.vv1.syncToEnv)
	async pushToEnv(body: ApiStruct_SyncEnv['vv1']['syncToEnv']['Body']): Promise<ApiStruct_SyncEnv['vv1']['syncToEnv']['Response']> {
		const url = this.syncEnvConfig.urlMap[body.env];
		if (!url)
			throw new BadImplementationException(`No urlMap for env: ${body.env}`);
		const sessionId = this.getRequestAuthHeader();
		const upsertAll = this.getUpsertAllApi(body.moduleName);
		if (!upsertAll)
			throw HttpCodes._4XX.NOT_FOUND(`No upsertAll API for module: ${body.moduleName}`);
		const fullUrl = `${url.replace(/\/$/, '')}/${upsertAll.path.replace(/^\//, '')}`;
		const req = this.httpClient
			.createRequest({method: upsertAll.method, path: '', timeout: 5 * Minute})
			.setUrl(fullUrl)
			.setBodyAsJson(body.items)
			.addHeader('Authorization', sessionId ?? '');
		await req.execute();
		return undefined as void;
	}


	@ApiHandler(ApiDef_SyncEnv.vv1.createBackup)
	async createBackup(_query?: ApiStruct_SyncEnv['vv1']['createBackup']['Params']): Promise<ApiStruct_SyncEnv['vv1']['createBackup']['Response']> {
		await this.backupProvider.initiateBackup(true);
		return undefined;
	}

	@ApiHandler(ApiDef_SyncEnv.vv1.getLatestBackup)
	async getLatestBackupId(_query?: ApiStruct_SyncEnv['vv1']['getLatestBackup']['Params']): Promise<ApiStruct_SyncEnv['vv1']['getLatestBackup']['Response']> {
		const result = await this.backupProvider.getLatestBackupId();
		if (!result?.latestBackupId)
			throw HttpCodes._4XX.ENTITY_DOESNT_EXISTS('No backup found');
		return result;
	}

	@ApiHandler(ApiDef_SyncEnv.vv1.syncFromEnvBackup)
	async syncFromEnvBackup(body: ApiStruct_SyncEnv['vv1']['syncFromEnvBackup']['Body']): Promise<ApiStruct_SyncEnv['vv1']['syncFromEnvBackup']['Response']> {
		if (!this.syncEnvConfig.allowSyncEnv)
			throw new MUSTNeverHappenException('SyncEnv is disabled on this env- to sync into this env, add \'allowSyncEnv: true\'.');
		if (!this.syncEnvConfig.allowCleanSync && body.cleanSync)
			throw new MUSTNeverHappenException('CleanSync is disabled on this env- to CleanSync into this env, add \'allowCleanSync: true\'.');
		const currentEnv = this.syncEnvConfig.currentEnv.toLowerCase();
		if (currentEnv === 'prod' && body.env.toLowerCase() !== 'prod')
			throw new MUSTNeverHappenException('MUST NEVER SYNC ENV THAT IS NOT PROD TO PROD!!');
		if (this.syncEnvConfig.allowedEnvsToSyncFrom && !this.syncEnvConfig.allowedEnvsToSyncFrom.includes(body.env))
			throw new MUSTNeverHappenException(`Env ${currentEnv} doesn't have env ${body.env} in it's allowedEnvsToSyncFrom list.`);

		this.logInfoBold('Received API call Fetch From Env!');
		this.logInfo(`Origin env: ${body.env}, backupId: ${body.backupId}`);
		let startTime: number | undefined;
		let endTime: number | undefined;

		if (this.syncEnvConfig.shouldBackupBeforeSync) {
			this.logInfo('----  Creating Backup... ----');
			startTime = performance.now();
			await this.backupProvider.initiateBackup(true);
			endTime = performance.now();
			this.logInfo(`Backup took ${((endTime - startTime) / 1000).toFixed(3)} seconds`);
		}

		if (body.cleanSync) {
			this.logInfo('----  Cleaning Collections From DB... ----');
			for (const dbKey of body.selectedModules) {
				await this.dbRegistry.deleteCollection(dbKey);
				this.logInfo(`----  Cleaned Collection ${dbKey} ----`);
			}
		}

		const backupInfo = await this.getBackupInfo(body);
		const stream = await this.backupProvider.createBackupReadStream(backupInfo);
		const collectionFilter = new SyncCollectionFilter(body.selectedModules);
		const entries = this.dbRegistry.getModuleEntries();
		const modulesMap = arrayToMap(entries, e => e.dbKey);
		const collectionWriter = createCollectionBatchWriter(
			body.chunkSize,
			modulesMap,
			msg => this.logWarning(msg)
		);

		this.logInfo('----  Syncing Collections From Backup... ----');
		startTime = performance.now();
		await new Promise<void>((resolve, reject) => {
			stream
				.pipe(collectionFilter)
				.pipe(collectionWriter)
				.on('finish', () => resolve())
				.on('error', reject);
		});
		endTime = performance.now();
		this.logInfo(`Syncing Collections took ${((endTime - startTime) / 1000).toFixed(3)} seconds`);

		this.logInfo('----  Syncing Other Modules... ----');
		const envUrl = this.syncEnvConfig.urlMap[body.env];
		const envSession = this.syncEnvConfig.sessionMap[body.env];
		if (envUrl && envSession)
			await dispatch_OnSyncEnvCompleted.dispatchModuleAsync(body.env, envUrl, envSession);
		this.logInfo('---- DONE Syncing Other Modules----');
		return undefined as void;
	}


	@ApiHandler(ApiDef_SyncEnv.vv1.syncFirebaseFromBackup)
	async syncFirebaseFromBackup(queryParams: ApiStruct_SyncEnv['vv1']['syncFirebaseFromBackup']['Params']): Promise<ApiStruct_SyncEnv['vv1']['syncFirebaseFromBackup']['Response']> {
		try {
			this.logDebug('Getting the firebase backup file');
			const firebaseSessionAdmin = ModuleBE_Firebase.createAdminSession();
			const backupInfo = await this.getBackupInfo(queryParams);
			const database = firebaseSessionAdmin.getDatabase();
			this.logDebug('Reading the file from storage');
			const req = this.httpClient
				.createRequest({method: HttpMethod.GET, path: '', timeout: 5 * Minute})
				.setUrl(backupInfo.firebaseSignedUrl);
			const firebaseFile = await req.execute();
			this.logDebug('Setting the file in firebase database');
			await database.set('/', firebaseFile);
			return undefined as void;
		} catch (err: unknown) {
			throw HttpCodes._5XX.INTERNAL_SERVER_ERROR('Sync to env failed', String(err), err instanceof Error ? err : new Error(String(err)));
		}
	}
}

