import {ApiDefResolver, BodyApi, QueryApi, HttpMethod} from '@nu-art/thunderstorm';
import {DBDef_PushKeys} from './db-def';


export type RequestType = {
//
};
export type ResponseType = {
//
};

export type ApiStruct_PushKeys = {
	_v1: {
		'?': BodyApi<ResponseType, RequestType>,
		'??': QueryApi<ResponseType, RequestType>,

	}
}

export const ApiDef_PushKeys: ApiDefResolver<ApiStruct_PushKeys> = {
	_v1: {
		'?': {method: HttpMethod.POST, path: `v1/${DBDef_PushKeys.dbName}/post`},
		'??': {method: HttpMethod.GET, path: `v1/${DBDef_PushKeys.dbName}/get`},
	}
};
