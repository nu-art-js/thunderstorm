import {ApiDefResolver, BodyApi, QueryApi, HttpMethod} from '@nu-art/thunderstorm';
import {DBDef_PushMessagesHistory} from './db-def';


export type RequestType = {
//
};
export type ResponseType = {
//
};

export type ApiStruct_PushMessagesHistory = {
	_v1: {
		'?': BodyApi<ResponseType, RequestType>,
		'??': QueryApi<ResponseType, RequestType>,

	}
}

export const ApiDef_PushMessagesHistory: ApiDefResolver<ApiStruct_PushMessagesHistory> = {
	_v1: {
		'?': {method: HttpMethod.POST, path: `v1/${DBDef_PushMessagesHistory.dbName}/post`},
		'??': {method: HttpMethod.GET, path: `v1/${DBDef_PushMessagesHistory.dbName}/get`},
	}
};
