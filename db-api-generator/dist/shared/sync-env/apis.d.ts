import { ApiDefResolver, BodyApi, QueryApi } from '@nu-art/thunderstorm';
import { UniqueId } from '@nu-art/ts-common';
export type Request_FetchFromEnv = {
    backupId: string;
    env: string;
    onlyModules?: string[];
    excludedModules?: string[];
};
export type Request_FetchFromEnvV2 = {
    backupId: string;
    env: string;
    selectedModules: string[];
};
export type Request_FetchFirebaseBackup = {
    backupId: UniqueId;
    env: string;
};
export type Request_GetMetadata = {
    backupId: UniqueId;
    env: string;
};
export type Response_GetMetadata = {
    collectionsData: {
        collectionName: string;
        numOfDocs: number;
        version: string;
    }[];
    timestamp: number;
};
export type ApiStruct_SyncEnv = {
    vv1: {
        fetchFromEnv: BodyApi<any, Request_FetchFromEnv>;
        createBackup: QueryApi<any>;
        fetchBackupMetadata: QueryApi<Response_GetMetadata, Request_GetMetadata>;
    };
};
export type ApiStruct_SyncEnvV2 = {
    vv1: {
        fetchFromEnv: BodyApi<any, Request_FetchFromEnvV2>;
        createBackup: QueryApi<any>;
        fetchBackupMetadata: QueryApi<Response_GetMetadata, Request_GetMetadata>;
        fetchFirebaseBackup: QueryApi<any, Request_FetchFirebaseBackup>;
    };
};
export declare const ApiDef_SyncEnv: ApiDefResolver<ApiStruct_SyncEnv>;
export declare const ApiDef_SyncEnvV2: ApiDefResolver<ApiStruct_SyncEnvV2>;
