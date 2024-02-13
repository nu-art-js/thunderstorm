import {FetchBackupDoc, FetchBackupDocV2} from './backup-types';
import {ApiDefResolver, HttpMethod, QueryApi} from '../types';

export type Request_BackupId = {
	backupId: string,
}

export type Response_BackupDocs = {
	backupDescriptors: FetchBackupDoc[],
}

export type Response_BackupDocsV2 = {
	backupInfo: FetchBackupDocV2,
}


export type ApiStruct_Backup = {
	vv1: {
		initiateBackup: QueryApi<void>,
		fetchBackupDocs: QueryApi<Response_BackupDocs, Request_BackupId>,
	}
}

export type ApiStruct_BackupV2 = {
	vv1: {
		initiateBackup: QueryApi<string | undefined>,
		fetchBackupDocs: QueryApi<Response_BackupDocsV2, Request_BackupId>,
	}
}

export const ApiDef_Backup: ApiDefResolver<ApiStruct_Backup> = {
	vv1: {
		initiateBackup: {method: HttpMethod.GET, path: 'v1/initiate-backup'},
		fetchBackupDocs: {method: HttpMethod.GET, path: 'v1/fetch-backup-docs'},
	}
};

export const ApiDef_BackupV2: ApiDefResolver<ApiStruct_BackupV2> = {
	vv1: {
		initiateBackup: {method: HttpMethod.GET, path: 'v1/initiate-backup-v2'},
		fetchBackupDocs: {method: HttpMethod.GET, path: 'v1/fetch-backup-docs-v2'},
	}
};