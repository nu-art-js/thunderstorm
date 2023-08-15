import {ApiDefResolver, BodyApi, HttpMethod} from '@nu-art/thunderstorm';

export type Request_AssignPermissions = {
	projectId?: string
	groupToAddIds: string[]
	groupToRemoveIds: string[]
	targetAccountIds: string[]
}

export type ApiStruct_PermissionsUser = {
	vv1: { assignPermissions: BodyApi<void, Request_AssignPermissions>; }
}
export const ApiDef_PermissionUser: ApiDefResolver<ApiStruct_PermissionsUser> = {
	vv1: {assignPermissions: {method: HttpMethod.POST, path: '/pah/permissions/assign/app-permissions'}}
};
