import {ApiDefResolver, BodyApi, HttpMethod} from '@nu-art/thunderstorm';

//Assign Permissions
export type Request_AssignPermissions = {
	projectId?: string
	permissionGroupIds: string[]
	targetAccountIds: string[]
}

export type ApiStruct_PermissionUser = {
	_v1: {
		assignPermissions: BodyApi<void, Request_AssignPermissions>;
	}
}

export const ApiDef_PermissionUser: ApiDefResolver<ApiStruct_PermissionUser> = {
	_v1: {
		assignPermissions: {method: HttpMethod.POST, path: '/pah/permissions/assign/app-permissions'}
	}
};
