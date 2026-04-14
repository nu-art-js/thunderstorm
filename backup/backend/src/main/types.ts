/*
 * @nu-art/backup-backend - Backup backend types
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {DB_Object} from '@nu-art/ts-common';
import type {FirestoreQuery} from '@nu-art/firebase-shared';

/** Minimal interface for a DB module that can be backed up (e.g. ModuleBE_BaseDB from db-api-backend). */
export type BackupableModule = {
	dbDef: { dbKey: string; versions: string[] };
	query: {
		unManipulatedQuery(query: FirestoreQuery<DB_Object>): Promise<DB_Object[]>;
	};
};

export type BackupDocDBConfig = {
	getModulesToBackup: () => BackupableModule[];
	onCleanup?: () => Promise<void>;
	upgradeCollections?: () => Promise<void>;
	excludedDbKeys?: string[];
	keepInterval?: number;
	minTimeThreshold?: number;
	/** Content-Type for signed URLs (e.g. from request headers). Defaults to application/octet-stream. */
	getSignedUrlContentType?: () => string;
	/** For getBackupInfo and getBackupStreamFromId (e.g. used by sync-env). */
	httpClient?: {
		createRequest(opts: { method: string; path: string; queryParams?: object }): {
			addHeaders?(h: Record<string, string | string[]>): { executeSync(): Promise<unknown> };
			setResponseType?(t: string): { executeSync(): Promise<unknown> };
			executeSync(): Promise<unknown>;
		};
	};
};
