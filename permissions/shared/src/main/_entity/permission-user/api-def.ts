import {ApiDefResolver, BodyApi, HttpMethod} from '@nu-art/api-types';
import {DatabaseDef_Account} from '@nu-art/user-account-shared';
import {DatabaseDef_PermissionGroup} from '../permission-group/types.js';
import {DatabaseDef_PermissionProject} from '../permission-project/types.js';

// Assign Permissions
export type Request_AssignPermissions = {
	projectId?: DatabaseDef_PermissionProject['id'];
	permissionGroupIds: DatabaseDef_PermissionGroup['id'][];
	targetAccountIds: DatabaseDef_Account['id'][];
};

export type API_PermissionUser = {
	assignPermissions: BodyApi<void, Request_AssignPermissions>;
};

export const ApiDef_PermissionUser: ApiDefResolver<API_PermissionUser> = {
	assignPermissions: {method: HttpMethod.POST, path: '/pah/permissions/assign/app-permissions'}
};
