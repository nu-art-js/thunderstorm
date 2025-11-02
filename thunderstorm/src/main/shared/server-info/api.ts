import {ApiDefResolver, HttpMethod, QueryApi} from '../types.js';
import {BasicServerInfo} from './types.js';


export type Response_ServerInfo = BasicServerInfo & {
	status: {
		firestore: string
		firebase: string
	}
}

export type ApiStruct_ServerInfo = {
	v1: {
		getServerInfo: QueryApi<Response_ServerInfo>
		updateServerInfoState: QueryApi<void>
	}
}

export const ApiDef_ServerInfo: ApiDefResolver<ApiStruct_ServerInfo> = {
	v1: {
		getServerInfo: {method: HttpMethod.GET, path: 'v1/server-info'},
		updateServerInfoState: {method: HttpMethod.GET, path: 'v1/update-server-info'}
	}
};