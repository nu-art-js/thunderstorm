import {ApiDefResolver, HttpMethod, QueryApi} from '@nu-art/thunder-db-api-shared';
import {FetchBackupDoc} from './types.js';

export type Request_BackupId = {
	backupId: string,
}

export type Response_BackupDocs = {
	backupInfo: FetchBackupDoc,
}


export type ApiStruct_BackupDoc = {
	_v1: {
		initiateBackup: QueryApi<{ pathToBackup: string } | undefined>,
		fetchBackupDocs: QueryApi<Response_BackupDocs, Request_BackupId>,
	}
}

export const ApiDef_BackupDoc: ApiDefResolver<ApiStruct_BackupDoc> = {
	_v1: {
		initiateBackup: {method: HttpMethod.GET, path: 'v1/initiate-backup-v2'},
		fetchBackupDocs: {method: HttpMethod.GET, path: 'v1/fetch-backup-docs-v2'},
	}
};

