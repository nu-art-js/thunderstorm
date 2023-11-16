import {ApiDefResolver, BodyApi, QueryApi, HttpMethod} from '@nu-art/thunderstorm';
import {DBDef_PushRegistration} from './db-def';


export type RequestType = {
//
};
export type ResponseType = {
//
};

export type ApiStruct_PushRegistration = {
	_v1: {
		'?': BodyApi<ResponseType, RequestType>,
		'??': QueryApi<ResponseType, RequestType>,

	}
}

export const ApiDef_PushRegistration: ApiDefResolver<ApiStruct_PushRegistration> = {
	_v1: {
		'?': {method: HttpMethod.POST, path: `v1/${DBDef_PushRegistration.dbName}/post`},
		'??': {method: HttpMethod.GET, path: `v1/${DBDef_PushRegistration.dbName}/get`},
	}
};
