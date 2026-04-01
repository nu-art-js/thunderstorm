import {ApiDefResolver, BodyApi, HttpMethod} from '@nu-art/api-types';
import {DatabaseDef_Account} from '@nu-art/user-account-shared';
import {DatabaseDef_PermissionRole} from '../permission-role/types.js';

export type Request_AssignPermissions = {
	permissionRoleIds: DatabaseDef_PermissionRole['id'][];
	targetAccountIds: DatabaseDef_Account['id'][];
};

export type API_PermissionUser = {
	assignPermissions: BodyApi<void, Request_AssignPermissions>;
};

export const ApiDef_PermissionUser: ApiDefResolver<API_PermissionUser> = {
	assignPermissions: {method: HttpMethod.POST, path: '/v1/permissions/assign'}
};
