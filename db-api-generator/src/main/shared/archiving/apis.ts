import {ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '@nu-art/thunderstorm';
import {DB_Object, UniqueId} from '@nu-art/ts-common';

export type RequestBody_HardDeleteUnique = {
	_id: UniqueId,
	collectionName: string,
	dbInstance?: DB_Object
}

export type RequestQuery_DeleteAll = {
	collectionName: string
}

export type RequestQuery_GetHistory = {
	_id: UniqueId,
	collectionName: string
}

export type ApiStruct_Archiving = {
	vv1: {
		hardDeleteUnique: BodyApi<void, RequestBody_HardDeleteUnique>,
		hardDeleteAll: QueryApi<void, RequestQuery_DeleteAll>,
		getDocumentHistory: QueryApi<DB_Object[], RequestQuery_GetHistory>
	}
}

export const ApiDef_Archiving: ApiDefResolver<ApiStruct_Archiving> = {
	vv1: {
		hardDeleteAll: {method: HttpMethod.GET, path: 'v1/archiving/hard-delete-all'},
		hardDeleteUnique: {method: HttpMethod.POST, path: 'v1/archiving/hard-delete-unique'},
		getDocumentHistory: {method: HttpMethod.GET, path: 'v1/archiving/get-document-history'}
	}
};