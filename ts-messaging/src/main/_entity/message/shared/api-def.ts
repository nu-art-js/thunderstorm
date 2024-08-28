import {ApiDefResolver, BodyApi, QueryApi, HttpMethod} from '@thunder-storm/core';
import {DBDef_message} from './db-def';


export type RequestType = {
//
};
export type ResponseType = {
//
};

export type ApiStruct_message = {
	_v1: {
		'?': BodyApi<ResponseType, RequestType>,
		'??': QueryApi<ResponseType, RequestType>,

	}
}

export const ApiDef_message: ApiDefResolver<ApiStruct_message> = {
	_v1: {
		'?': {method: HttpMethod.POST, path: `v1/${DBDef_message.dbKey}/post`},
		'??': {method: HttpMethod.GET, path: `v1/${DBDef_message.dbKey}/get`},
	}
};
