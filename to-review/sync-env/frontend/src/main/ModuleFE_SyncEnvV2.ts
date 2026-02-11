/*
 * @nu-art/sync-env-frontend - Sync env frontend API client
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Module} from '@nu-art/ts-common';
import {
	ApiDef_SyncEnv,
	Request_FetchFromEnv,
	Request_FetchFirebaseBackup,
	Request_GetMetadata,
	Response_FetchBackupMetadata
} from '@nu-art/sync-env-shared';
import {HttpClient} from '@nu-art/http-client';

type GetLatestBackupSync = { executeSync(): Promise<{ latestBackupId: string }> };
type SyncToEnvSync = { executeSync(): Promise<void> };
type SyncFromEnvBackupSync = { executeSync(): Promise<void> };
type CreateBackupSync = { executeSync(): Promise<{ pathToBackup?: string } | undefined> };
type FetchBackupMetadataSync = { executeSync(): Promise<Response_FetchBackupMetadata> };
type SyncFirebaseFromBackupSync = { executeSync(): Promise<unknown> };

class ModuleFE_SyncEnvV2_Class
	extends Module {

	readonly vv1: {
		getLatestBackup: (params?: Record<string, string | number | boolean | undefined>) => GetLatestBackupSync;
		syncToEnv: (body: { env: 'dev' | 'prod'; moduleName: string; items: unknown[] }) => SyncToEnvSync;
		syncFromEnvBackup: (body: Request_FetchFromEnv) => SyncFromEnvBackupSync;
		createBackup: (params?: Record<string, string | number | boolean | undefined>) => CreateBackupSync;
		fetchBackupMetadata: (params: Request_GetMetadata) => FetchBackupMetadataSync;
		syncFirebaseFromBackup: (params: Request_FetchFirebaseBackup) => SyncFirebaseFromBackupSync;
	};

	private readonly httpClient?: HttpClient;

	constructor(httpClient?: HttpClient) {
		super();
		this.httpClient = httpClient;
		const client = () => {
			const c = this.httpClient ?? HttpClient.default;
			if (!c)
				throw new Error('ModuleFE_SyncEnvV2: HttpClient.default must be set or pass httpClient to constructor');
			return c;
		};
		this.vv1 = {
			getLatestBackup: (params) => ({
				executeSync: () =>
					client().createRequest(ApiDef_SyncEnv.vv1.getLatestBackup).setUrlParams(params ?? {}).execute()
			}),
			syncToEnv: (body) => ({
				executeSync: async () => {
					await client().createRequest(ApiDef_SyncEnv.vv1.syncToEnv).setBodyAsJson(body).execute();
				}
			}),
			syncFromEnvBackup: (body) => ({
				executeSync: async () => {
					await client().createRequest(ApiDef_SyncEnv.vv1.syncFromEnvBackup).setBodyAsJson(body).execute();
				}
			}),
			createBackup: (params) => ({
				executeSync: () =>
					client().createRequest(ApiDef_SyncEnv.vv1.createBackup).setUrlParams(params ?? {}).execute()
			}),
			fetchBackupMetadata: (params: Request_GetMetadata) => ({
				executeSync: () =>
					client().createRequest(ApiDef_SyncEnv.vv1.fetchBackupMetadata).setUrlParams(params).execute()
			}),
			syncFirebaseFromBackup: (params: Request_FetchFirebaseBackup) => ({
				executeSync: () =>
					client().createRequest(ApiDef_SyncEnv.vv1.syncFirebaseFromBackup).setUrlParams(params).execute()
			})
		};
	}
}

export const ModuleFE_SyncEnvV2 = new ModuleFE_SyncEnvV2_Class();
