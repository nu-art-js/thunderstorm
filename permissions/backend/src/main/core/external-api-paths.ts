/**
 * Path strings for external APIs referenced in permission domains.
 * Replaces imports from thunderstorm-shared (ApiDef_ActionProcessing, ApiDef_CollectionActions, ApiDef_SyncEnv).
 * Update these if the corresponding v2 packages change their routes.
 */
export const Path_ActionProcessor_List = 'v1/action-processor/list';
export const Path_ActionProcessor_Execute = 'v1/action-processor/execute';
export const Path_CollectionActions_UpgradeAll = 'v1/collection-actions/upgrade/all';
export const Path_SyncEnv_FetchBackupMetadata = 'v1/sync-env/fetch-backup-metadata';
export const Path_SyncEnv_CreateBackup = 'v1/sync-env/create-backup-v2';
export const Path_SyncEnv_SyncFromEnvBackup = 'v1/sync-env/fetch-from-env-v2';
export const Path_SyncEnv_SyncFirebaseFromBackup = 'v1/sync-env/fetch-firebase-backup';
export const Path_SyncEnv_SyncToEnv = 'v1/sync-env/sync-to-env';
