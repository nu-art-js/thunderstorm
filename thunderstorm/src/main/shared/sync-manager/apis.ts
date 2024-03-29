import {ApiDefResolver, HttpMethod} from '../types';
import {Second} from '@nu-art/ts-common';
import {ApiStruct_SyncManager} from './types';


export const ApiDef_SyncManager: ApiDefResolver<ApiStruct_SyncManager> = {
	v1: {
		checkSync: {method: HttpMethod.GET, path: 'v1/db-api/sync-all'},
	}
};

export const ApiDef_SyncManagerV2: ApiDefResolver<ApiStruct_SyncManager> = {
	v1: {
		checkSync: {method: HttpMethod.GET, path: 'v2/db-api/sync-all-v2', timeout: 60 * Second},
	}
};
