import {ApiDefResolver, BodyApi, HttpMethod} from '@nu-art/thunderstorm';
import {Minute} from '@nu-art/ts-common';


export type Request_FetchFromEnv = {
	backupId: string,
	env: string,
	onlyModules?: string[], // fetches only these modules
	excludedModules?: string[], // if onlyModules is not present, will exclude the specified modules
}

export type ApiStruct_SyncEnv = {
	vv1: {
		fetchFromEnv: BodyApi<any, Request_FetchFromEnv>
	}
}

export const ApiDef_SyncEnv: ApiDefResolver<ApiStruct_SyncEnv> = {
	vv1: {
		fetchFromEnv: {method: HttpMethod.POST, path: 'v1/sync-env/fetch-from-env', timeout: 5 * Minute},
	}
};

export const ApiDef_SyncEnvV2: ApiDefResolver<ApiStruct_SyncEnv> = {
	vv1: {
		fetchFromEnv: {method: HttpMethod.POST, path: 'v1/sync-env/fetch-from-env-v2', timeout: 5 * Minute},
	}
};