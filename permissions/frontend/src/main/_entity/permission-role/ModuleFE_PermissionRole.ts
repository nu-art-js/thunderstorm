import {ModuleFE_BaseApi, buildConfigFromDBDef} from '@nu-art/db-api-frontend';
import {ApiCallerEventType, CrudApiDef} from '@nu-art/db-api-shared';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {DBDef_PermissionRole, DatabaseDef_PermissionRole} from '@nu-art/permissions-shared';

export interface OnPermissionRoleUpdated {
	__onPermissionRoleUpdated: (...params: ApiCallerEventType<DatabaseDef_PermissionRole['dbType']>) => void;
}

export const dispatch_onPermissionRoleChanged = new ThunderDispatcher<OnPermissionRoleUpdated, '__onPermissionRoleUpdated'>('__onPermissionRoleUpdated');

export class ModuleFE_PermissionRole_Class
	extends ModuleFE_BaseApi<DatabaseDef_PermissionRole> {

	constructor() {
		super({
			config: buildConfigFromDBDef<DatabaseDef_PermissionRole>(DBDef_PermissionRole),
			crudApiDef: CrudApiDef<DatabaseDef_PermissionRole>(DBDef_PermissionRole.dbKey),
			dispatcher: (...args) => dispatch_onPermissionRoleChanged.dispatchAll(...args)
		});
	}
}

export const ModuleFE_PermissionRole = new ModuleFE_PermissionRole_Class();
