import {ApiDefResolver, BodyApi, QueryApi, HttpMethod} from '@thunder-storm/core';
import {DBDef_Topic} from './db-def';


export type RequestType = {
//
};
export type ResponseType = {
//
};

export type ApiStruct_topic = {
	_v1: {
		'?': BodyApi<ResponseType, RequestType>,
		'??': QueryApi<ResponseType, RequestType>,

	}
}

export const ApiDef_topic: ApiDefResolver<ApiStruct_topic> = {
	_v1: {
		'?': {method: HttpMethod.POST, path: `v1/${DBDef_Topic.dbKey}/post`},
		'??': {method: HttpMethod.GET, path: `v1/${DBDef_Topic.dbKey}/get`},
	}
};
