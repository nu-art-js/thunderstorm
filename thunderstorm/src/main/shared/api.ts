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

export type ApiStruct_Backup = {
	vv1: {
		initiateBackup: QueryApi<{}>,
	}
}

export const ApiDef_Backup: ApiDefResolver<ApiStruct_Backup> = {
	vv1: {
		initiateBackup: {method: HttpMethod.GET, path: 'v1/initiate-backup'},
	}
};