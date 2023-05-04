import { ApiDefResolver, BodyApi } from '@nu-art/thunderstorm';
export type Request_FetchFromEnv = {
    backupId: string;
    env: string;
    onlyModules?: string[];
    excludedModules?: string[];
};
export type ApiStruct_SyncEnv = {
    vv1: {
        fetchFromEnv: BodyApi<any, Request_FetchFromEnv>;
    };
};
export declare const ApiDef_SyncEnv: ApiDefResolver<ApiStruct_SyncEnv>;
