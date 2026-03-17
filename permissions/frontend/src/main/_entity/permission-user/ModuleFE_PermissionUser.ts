import {ApiCaller} from '@nu-art/http-client';
import {ModuleFE_BaseApi, buildConfigFromDBDef} from '@nu-art/db-api-frontend';
import {ApiCallerEventType, CrudApiDef} from '@nu-art/db-api-shared';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {ApiDef_PermissionUser, DBDef_PermissionUser, DatabaseDef_PermissionUser, Request_AssignPermissions} from '@nu-art/permissions-shared';

export interface OnPermissionUserUpdated {
	__onPermissionUserUpdated: (...params: ApiCallerEventType<DatabaseDef_PermissionUser['dbType']>) => void;
}

export const dispatch_onPermissionUserChanged = new ThunderDispatcher<OnPermissionUserUpdated, '__onPermissionUserUpdated'>('__onPermissionUserUpdated');

export class ModuleFE_PermissionUser_Class
	extends ModuleFE_BaseApi<DatabaseDef_PermissionUser> {

	constructor() {
		super({
			config: buildConfigFromDBDef<DatabaseDef_PermissionUser>(DBDef_PermissionUser),
			crudApiDef: CrudApiDef<DatabaseDef_PermissionUser>(DBDef_PermissionUser.dbKey),
			dispatcher: (...args) => dispatch_onPermissionUserChanged.dispatchAll(...args)
		});
	}

	@ApiCaller(ApiDef_PermissionUser.assignPermissions)
	async assignPermissions(body: Request_AssignPermissions): Promise<void> {
		void body;
	}
}

export const ModuleFE_PermissionUser = new ModuleFE_PermissionUser_Class();
