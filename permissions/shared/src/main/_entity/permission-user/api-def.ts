import {ApiDefResolver, BodyApi, HttpMethod} from '@nu-art/api-types';

// Assign Permissions
export type Request_AssignPermissions = {
	projectId?: string
	permissionGroupIds: string[]
	targetAccountIds: string[]
};

export type API_PermissionUser = {
	assignPermissions: BodyApi<void, Request_AssignPermissions>;
};

export const ApiDef_PermissionUser: ApiDefResolver<API_PermissionUser> = {
	assignPermissions: {method: HttpMethod.POST, path: '/pah/permissions/assign/app-permissions'}
};
