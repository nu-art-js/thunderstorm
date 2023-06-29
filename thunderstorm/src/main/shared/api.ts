import {FetchBackupDoc} from './backup-types';
import {ApiDefResolver, HttpMethod, QueryApi} from './types';

export type Response_ServerInfo = {
	version: string
	environment: string
}

export type ApiStruct_ServerInfo = {
	v1: {
		getServerInfo: QueryApi<Response_ServerInfo>
	}
}

export const ApiDef_ServerInfo: ApiDefResolver<ApiStruct_ServerInfo> = {
	v1: {
		getServerInfo: {method: HttpMethod.GET, path: 'v1/server-info'}
	}
};

export type Request_BackupId = {
	backupId: string,
}

export type Response_BackupDocs = {
	backupDescriptors: FetchBackupDoc[],
}

export type ApiStruct_Backup = {
	vv1: {
		initiateBackup: QueryApi<void>,
		fetchBackupDocs: QueryApi<Response_BackupDocs, Request_BackupId>,
	}
}

export const ApiDef_Backup: ApiDefResolver<ApiStruct_Backup> = {
	vv1: {
		initiateBackup: {method: HttpMethod.GET, path: 'v1/initiate-backup'},
		fetchBackupDocs: {method: HttpMethod.GET, path: 'v1/fetch-backup-docs'},
	}
};