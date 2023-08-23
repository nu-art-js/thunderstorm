import { ApiDefResolver, BodyApi, QueryApi } from '@nu-art/thunderstorm';
import { DB_Object, UniqueId } from '@nu-art/ts-common';
export type RequestBody_HardDeleteUnique = {
    _id: UniqueId;
    collectionName: string;
    dbInstance?: DB_Object;
};
export type RequestQuery_DeleteAll = {
    collectionName: string;
};
export type RequestQuery_GetHistory = {
    _id: UniqueId;
    collectionName: string;
};
export type ApiStruct_Archiving = {
    vv1: {
        hardDeleteUnique: BodyApi<void, RequestBody_HardDeleteUnique>;
        hardDeleteAll: QueryApi<void, RequestQuery_DeleteAll>;
        getDocumentHistory: QueryApi<DB_Object[], RequestQuery_GetHistory>;
    };
};
export declare const ApiDef_Archiving: ApiDefResolver<ApiStruct_Archiving>;
