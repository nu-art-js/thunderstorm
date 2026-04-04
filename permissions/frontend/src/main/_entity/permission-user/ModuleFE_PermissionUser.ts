import {buildConfigFromDBDef, ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {ApiCallerEventType, CrudApiDef} from '@nu-art/db-api-shared';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {DatabaseDef_PermissionUser, DBDef_PermissionUser} from '@nu-art/permissions-shared';

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

	// @ApiCaller(ApiDef_PermissionUser.assignPermissions)
	// async assignPermissions(body: API_PermissionUser['assignPermissions']['Body']): Promise<API_PermissionUser['assignPermissions']['Response']> {
	// 	void body;
	// 	return undefined as unknown as API_PermissionUser['assignPermissions']['Response'];
	// }
}

export const ModuleFE_PermissionUser = new ModuleFE_PermissionUser_Class();
