import {Minute, UniqueId} from '@nu-art/ts-common';
import {ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '../types';


export type Request_FetchFromEnv = {
	backupId: string,
	env: string,
	onlyModules?: string[], // fetches only these modules
	excludedModules?: string[], // if onlyModules is not present, will exclude the specified modules
}

export type Request_FetchFromEnvV2 = {
	backupId: string,
	env: string,
	selectedModules: string[]
}

export type Request_FetchFirebaseBackup = { backupId: UniqueId, env: string }

export type Request_GetMetadata = { backupId: UniqueId, env: string }
export type Response_GetMetadata = {
	collectionsData: { collectionName: string, numOfDocs: number, version: string }[],
	timestamp: number
}

export type ApiStruct_SyncEnv = {
	vv1: {
		fetchFromEnv: BodyApi<any, Request_FetchFromEnv>
		createBackup: QueryApi<any>,
		fetchBackupMetadata: QueryApi<Response_GetMetadata, Request_GetMetadata>
	}
}

export type ApiStruct_SyncEnvV2 = {
	vv1: {
		syncToEnv: BodyApi<any, { env: 'dev' | 'prod', moduleName: string, items: any[] }>
		fetchFromEnv: BodyApi<any, Request_FetchFromEnvV2>
		createBackup: QueryApi<any>,
		fetchBackupMetadata: QueryApi<Response_GetMetadata, Request_GetMetadata>,
		fetchFirebaseBackup: QueryApi<any, Request_FetchFirebaseBackup>
	}
}

export const ApiDef_SyncEnv: ApiDefResolver<ApiStruct_SyncEnv> = {
	vv1: {
		fetchFromEnv: {method: HttpMethod.POST, path: 'v1/sync-env/fetch-from-env', timeout: 5 * Minute},
		createBackup: {method: HttpMethod.GET, path: 'v1/sync-env/create-backup', timeout: 5 * Minute},
		fetchBackupMetadata: {method: HttpMethod.GET, path: 'v1/sync-env/fetch-backup-metadata', timeout: 5 * Minute}
	}
};

export const ApiDef_SyncEnvV2: ApiDefResolver<ApiStruct_SyncEnvV2> = {
	vv1: {
		syncToEnv: {method: HttpMethod.POST, path: 'v1/sync-env/sync-to-env', timeout: 5 * Minute},
		fetchFromEnv: {method: HttpMethod.POST, path: 'v1/sync-env/fetch-from-env-v2', timeout: 5 * Minute},
		createBackup: {method: HttpMethod.GET, path: 'v1/sync-env/create-backup-v2', timeout: 5 * Minute},
		fetchBackupMetadata: {method: HttpMethod.GET, path: 'v1/sync-env/fetch-backup-metadata', timeout: 5 * Minute},
		fetchFirebaseBackup: {method: HttpMethod.GET, path: 'v1/sync-env/fetch-firebase-backup', timeout: 5 * Minute}
	}
};