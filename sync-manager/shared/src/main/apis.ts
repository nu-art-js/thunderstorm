/*
 * @nu-art/sync-manager-shared - Sync manager API definitions
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiDefResolver, BodyApi, HttpMethod} from '@nu-art/api-types';
import {Minute} from '@nu-art/ts-common';
import {DeltaSyncModule, FullSyncModule, NoNeedToSyncModule, SyncDbData} from './types.js';

export type SyncManagerAPI_SmartSync = {
	request: {
		modules: SyncDbData[];
	};
	response: {
		modules: (NoNeedToSyncModule | DeltaSyncModule | FullSyncModule)[];
	};
};

export type ApiStruct_SyncManager = {
	smartSync: BodyApi<SyncManagerAPI_SmartSync['response'], SyncManagerAPI_SmartSync['request']>;
};

export const ApiDef_SyncManager: ApiDefResolver<ApiStruct_SyncManager> = {
	smartSync: {method: HttpMethod.POST, path: 'v1/db-api/smart-sync', timeout: Minute},
};
