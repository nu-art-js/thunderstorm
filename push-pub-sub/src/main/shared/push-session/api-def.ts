import {ApiDefResolver, BodyApi, QueryApi, HttpMethod} from '@nu-art/thunderstorm';
import {DBDef_PushSession} from './db-def';


export type RequestType = {
//
};
export type ResponseType = {
//
};

export type ApiStruct_PushSession = {
	_v1: {
		'?': BodyApi<ResponseType, RequestType>,
		'??': QueryApi<ResponseType, RequestType>,

	}
}

export const ApiDef_PushSession: ApiDefResolver<ApiStruct_PushSession> = {
	_v1: {
		'?': {method: HttpMethod.POST, path: `v1/${DBDef_PushSession.dbKey}/post`},
		'??': {method: HttpMethod.GET, path: `v1/${DBDef_PushSession.dbKey}/get`},
	}
};
