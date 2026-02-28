import {ApiCaller} from '@nu-art/http-client';
import {ModuleFE_BaseApi} from '@nu-art/thunderstorm-frontend/index';
import {DispatcherDef, ThunderDispatcherV3} from '@nu-art/thunderstorm-frontend/core/db-api-gen/types';
import {ApiDef_PermissionUser, DBDef_PermissionUser, DatabaseDef_PermissionUser, Request_AssignPermissions} from '@nu-art/permissions-shared';


export type DispatcherType_PermissionUser = DispatcherDef<DatabaseDef_PermissionUser, `__onPermissionUserUpdated`>;

export const dispatch_onPermissionUserChanged = new ThunderDispatcherV3<DispatcherType_PermissionUser>('__onPermissionUserUpdated');

export class ModuleFE_PermissionUser_Class
	extends ModuleFE_BaseApi<DatabaseDef_PermissionUser> {

	constructor() {
		super(DBDef_PermissionUser, dispatch_onPermissionUserChanged);
	}

	@ApiCaller(ApiDef_PermissionUser.assignPermissions)
	async assignPermissions(body: Request_AssignPermissions): Promise<void> {
		void body;
	}
}

export const ModuleFE_PermissionUser = new ModuleFE_PermissionUser_Class();

