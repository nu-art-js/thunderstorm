import {ApiDefResolver, BodyApi, QueryApi, HttpMethod} from '@nu-art/thunderstorm';
import {DBDef_PushSubscription} from './db-def';


export type RequestType = {
//
};
export type ResponseType = {
//
};

export type ApiStruct_PushSubscription = {
	_v1: {
		'?': BodyApi<ResponseType, RequestType>,
		'??': QueryApi<ResponseType, RequestType>,

	}
}

export const ApiDef_PushSubscription: ApiDefResolver<ApiStruct_PushSubscription> = {
	_v1: {
		'?': {method: HttpMethod.POST, path: `v1/${DBDef_PushSubscription.dbName}/post`},
		'??': {method: HttpMethod.GET, path: `v1/${DBDef_PushSubscription.dbName}/get`},
	}
};
