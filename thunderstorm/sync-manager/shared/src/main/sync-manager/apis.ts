import { ApiDefResolver, BodyApi, HttpMethod } from "@nu-art/thunder-db-api-shared";
import { Minute } from '@nu-art/ts-common';
import { DeltaSyncModule, FullSyncModule, NoNeedToSyncModule, SyncDbData } from './types.js';
export type SyncManagerAPI_SmartSync = {
    request: {
        modules: SyncDbData[];
    };
    response: {
        modules: (NoNeedToSyncModule | DeltaSyncModule | FullSyncModule)[];
    };
};
export type ApiStruct_SyncManager = {
    v1: {
        smartSync: BodyApi<SyncManagerAPI_SmartSync['response'], SyncManagerAPI_SmartSync['request']>;
    };
};
export const ApiDef_SyncManager: ApiDefResolver<ApiStruct_SyncManager> = {
    v1: {
        smartSync: { method: HttpMethod.POST, path: 'v1/db-api/smart-sync', timeout: Minute },
    }
};
