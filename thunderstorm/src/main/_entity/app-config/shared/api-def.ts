import {ApiDefResolver, HttpMethod, QueryApi} from '../../../shared/types';

export type RequestBody_GetResolverByKey = { key: string };

export type ApiStruct_AppConfig = {
	_v1: {
		getConfigByKey: QueryApi<any, RequestBody_GetResolverByKey>,
	}
}

export const ApiDef_AppConfig: ApiDefResolver<ApiStruct_AppConfig> = {
	_v1: {
		getConfigByKey: {method: HttpMethod.GET, path: 'v1/app-config/get-resolver-data-by-key'},
	}
};
