/*
 * @nu-art/backup-shared - Backup API definitions
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiDefResolver, HttpMethod, QueryApi} from '@nu-art/api-types';
import type {FetchBackupDoc} from './types.js';

export type Request_BackupId = {
	backupId: string;
};

export type Response_BackupDocs = {
	backupInfo: FetchBackupDoc;
};

export type Response_InitiateBackup = { pathToBackup: string; backupId: string } | undefined;

export type ApiStruct_BackupDoc = {
	initiateBackup: QueryApi<Response_InitiateBackup>;
	fetchBackupDocs: QueryApi<Response_BackupDocs, Request_BackupId>;
};

export const ApiDef_BackupDoc: ApiDefResolver<ApiStruct_BackupDoc> = {
	initiateBackup: {method: HttpMethod.GET, path: 'v1/initiate-backup-v2'},
	fetchBackupDocs: {method: HttpMethod.GET, path: 'v1/fetch-backup-docs-v2'}
};
