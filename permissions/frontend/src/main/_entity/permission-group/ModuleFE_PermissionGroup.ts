import {ModuleFE_BaseApi, buildConfigFromDBDef} from '@nu-art/db-api-frontend';
import {ApiCallerEventType, CrudApiDef} from '@nu-art/db-api-shared';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {DBDef_PermissionGroup, DatabaseDef_PermissionGroup} from '@nu-art/permissions-shared';

export interface OnPermissionGroupUpdated {
	__onPermissionGroupUpdated: (...params: ApiCallerEventType<DatabaseDef_PermissionGroup['dbType']>) => void;
}

export const dispatch_onPermissionGroupChanged = new ThunderDispatcher<OnPermissionGroupUpdated, '__onPermissionGroupUpdated'>('__onPermissionGroupUpdated');

export class ModuleFE_PermissionGroup_Class
	extends ModuleFE_BaseApi<DatabaseDef_PermissionGroup> {

	constructor() {
		super({
			config: buildConfigFromDBDef<DatabaseDef_PermissionGroup>(DBDef_PermissionGroup),
			crudApiDef: CrudApiDef<DatabaseDef_PermissionGroup>(DBDef_PermissionGroup.dbKey),
			dispatcher: (...args) => dispatch_onPermissionGroupChanged.dispatchAll(...args)
		});
	}
}

export const ModuleFE_PermissionGroup = new ModuleFE_PermissionGroup_Class();
