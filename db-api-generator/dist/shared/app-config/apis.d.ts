import { ApiDefResolver, QueryApi } from '@nu-art/thunderstorm';
export type RequestBody_GetResolverByKey = {
    key: string;
};
export type ApiStruct_AppConfig = {
    vv1: {
        getConfigByKey: QueryApi<any, RequestBody_GetResolverByKey>;
    };
};
export declare const ApiDef_AppConfig: ApiDefResolver<ApiStruct_AppConfig>;
