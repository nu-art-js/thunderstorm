import {ApiDefResolver, BodyApi, HttpMethod} from '@nu-art/thunderstorm';

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
		fetchFromEnv: {method: HttpMethod.POST, path: 'v1/sync-env/fetch-from-env'},
	}
};