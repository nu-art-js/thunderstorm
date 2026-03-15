import {ApiDefResolver, HttpMethod, QueryApi} from '../../types.js';

export type RequestBody_GetResolverByKey = { key: string };

export type API_AppConfig = {
	getConfigByKey: QueryApi<any, RequestBody_GetResolverByKey>;
};

export const ApiDef_AppConfig: ApiDefResolver<API_AppConfig> = {
	getConfigByKey: {method: HttpMethod.GET, path: 'v1/app-config/get-resolver-data-by-key'},
};
