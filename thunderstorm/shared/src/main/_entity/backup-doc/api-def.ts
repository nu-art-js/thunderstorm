import {ApiDefResolver, HttpMethod, QueryApi} from '../../types.js';
import {FetchBackupDoc} from './types.js';

export type Request_BackupId = {
	backupId: string,
}

export type Response_BackupDocs = {
	backupInfo: FetchBackupDoc,
}


export type API_BackupDoc = {
	initiateBackup: QueryApi<{ pathToBackup: string } | undefined>;
	fetchBackupDocs: QueryApi<Response_BackupDocs, Request_BackupId>;
};

export const ApiDef_BackupDoc: ApiDefResolver<API_BackupDoc> = {
	initiateBackup: {method: HttpMethod.GET, path: 'v1/initiate-backup-v2'},
	fetchBackupDocs: {method: HttpMethod.GET, path: 'v1/fetch-backup-docs-v2'},
};