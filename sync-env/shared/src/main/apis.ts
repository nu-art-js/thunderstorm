/*
 * @nu-art/sync-env-shared - Sync env API definitions and types
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Minute, UniqueId} from '@nu-art/ts-common';
import {ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '@nu-art/api-types';

/** Minimal backup metadata shape used by sync-env; no dependency on backup-doc entity. */
export type SyncEnvBackupMetadata = {
	collectionsData: Array<{ dbKey: string; numOfDocs: number; version: string }>;
	timestamp: number;
};

export type Request_FetchFromEnv = {
	backupId: string;
	env: string;
	chunkSize: number;
	selectedModules: string[];
	cleanSync?: boolean;
};

export type Request_FetchFirebaseBackup = { backupId: UniqueId; env: string };

export type Request_GetMetadata = { backupId: UniqueId; env: string };

export type Response_FetchBackupMetadata = SyncEnvBackupMetadata & {
	remoteCollectionNames: string[];
};

export type ApiStruct_SyncEnv = {
	vv1: {
		getLatestBackup: QueryApi<{ latestBackupId: string }>;
		syncToEnv: BodyApi<void, { env: 'dev' | 'prod'; moduleName: string; items: unknown[] }>;
		syncFromEnvBackup: BodyApi<void, Request_FetchFromEnv>;
		createBackup: QueryApi<{ pathToBackup: string } | undefined>;
		fetchBackupMetadata: QueryApi<Response_FetchBackupMetadata, Request_GetMetadata>;
		syncFirebaseFromBackup: QueryApi<void, Request_FetchFirebaseBackup>;
	};
};

export const ApiDef_SyncEnv: ApiDefResolver<ApiStruct_SyncEnv> = {
	vv1: {
		getLatestBackup: {method: HttpMethod.GET, path: 'v1/sync-env/get-last-backup-id'},
		syncToEnv: {method: HttpMethod.POST, path: 'v1/sync-env/sync-to-env', timeout: 5 * Minute},
		syncFromEnvBackup: {method: HttpMethod.POST, path: 'v1/sync-env/fetch-from-env-v2', timeout: 5 * Minute},
		createBackup: {method: HttpMethod.GET, path: 'v1/sync-env/create-backup-v2', timeout: 5 * Minute},
		fetchBackupMetadata: {method: HttpMethod.GET, path: 'v1/sync-env/fetch-backup-metadata', timeout: 5 * Minute},
		syncFirebaseFromBackup: {method: HttpMethod.GET, path: 'v1/sync-env/fetch-firebase-backup', timeout: 5 * Minute}
	}
};
