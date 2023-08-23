import { Module, TypedMap } from '@nu-art/ts-common';
import { Request_FetchFirebaseBackup, Request_FetchFromEnvV2, Request_GetMetadata } from '../shared';
type Config = {
    urlMap: TypedMap<string>;
    fetchBackupDocsSecretsMap: TypedMap<string>;
    maxBatch: number;
};
declare class ModuleBE_v2_SyncEnv_Class extends Module<Config> {
    constructor();
    init(): void;
    fetchBackupMetadata: (queryParams: Request_GetMetadata) => Promise<import("@nu-art/thunderstorm/backend/modules/backup/ModuleBE_v2_Backup").BackupMetaData>;
    private getBackupInfo;
    createBackup: () => Promise<void>;
    fetchFromEnv: (body: Request_FetchFromEnvV2) => Promise<void>;
    fetchFirebaseBackup: (queryParams: Request_FetchFirebaseBackup) => Promise<void>;
}
export declare const ModuleBE_v2_SyncEnv: ModuleBE_v2_SyncEnv_Class;
export {};
