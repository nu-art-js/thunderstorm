/*
 * @nu-art/sync-env-backend - Sync env backend types and provider contracts
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {Readable} from 'stream';
import type {SyncEnvBackupMetadata} from '@nu-art/sync-env-shared';
import type {HttpMethod} from '@nu-art/api-types';
import type {TypedMap} from '@nu-art/ts-common';

/** Minimal backup info shape returned by BackupProvider.getBackupInfo (e.g. from backup-doc fetch). */
export type SyncEnvBackupInfo = {
	_id: string;
	firebaseSignedUrl: string;
	metadata?: SyncEnvBackupMetadata;
	[key: string]: unknown;
};

/** Provides backup operations; app wires to ModuleBE_BackupDocDB or equivalent. */
export type BackupProvider = {
	getBackupInfo(backupId: string, baseUrl: string, headers: TypedMap<string | string[]>): Promise<SyncEnvBackupInfo>;
	createBackupReadStream(backupInfo: SyncEnvBackupInfo): Promise<Readable>;
	initiateBackup(force?: boolean): Promise<void>;
	getLatestBackupId(): Promise<{ latestBackupId: string }>;
};

/** Entry for one DB module used by batch writer and clean sync. */
export type SyncEnvDBModuleEntry = {
	dbKey: string;
	collectionName: string;
};

/** Registry of DB modules (by dbKey); app wires to RuntimeModules/BaseDB or equivalent. */
export type SyncEnvDBRegistry = {
	getModuleEntries(): SyncEnvDBModuleEntry[];
	deleteCollection(dbKey: string): Promise<void>;
};

/** Returns upsertAll API def for a module name; app wires to BaseApi or equivalent. */
export type UpsertApiDef = { path: string; method: HttpMethod };

export type GetUpsertAllApi = (moduleName: string) => UpsertApiDef | null;

/** Sync env backend config (urlMap/sessionMap per env, flags, batch size). */
export type SyncEnvBackendConfig = {
	urlMap: TypedMap<string>;
	sessionMap: TypedMap<TypedMap<string>>;
	currentEnv: string;
	maxBatch: number;
	allowSyncEnv?: boolean;
	allowCleanSync?: boolean;
	allowedEnvsToSyncFrom?: string[];
	shouldBackupBeforeSync?: boolean;
};
