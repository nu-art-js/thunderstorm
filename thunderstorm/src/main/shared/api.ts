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