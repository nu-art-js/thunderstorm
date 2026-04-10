import {ApiDefResolver, HttpMethod, QueryApi} from '@nu-art/api-types';

export type Response_MyPermissions = {
	scopeEntries: string[];
};

export type API_UserPermissions = {
	getMyPermissions: QueryApi<Response_MyPermissions>;
};

export const ApiDef_UserPermissions: ApiDefResolver<API_UserPermissions> = {
	getMyPermissions: {method: HttpMethod.GET, path: '/v1/permissions/my-permissions'},
};
