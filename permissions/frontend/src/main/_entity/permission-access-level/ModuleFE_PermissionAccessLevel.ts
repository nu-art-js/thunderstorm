import {ModuleFE_BaseApi, buildConfigFromDBDef} from '@nu-art/db-api-frontend';
import {ApiCallerEventType, CrudApiDef} from '@nu-art/db-api-shared';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {DBDef_PermissionAccessLevel, DatabaseDef_PermissionAccessLevel} from '@nu-art/permissions-shared';

export interface OnPermissionAccessLevelUpdated {
	__onPermissionAccessLevelUpdated: (...params: ApiCallerEventType<DatabaseDef_PermissionAccessLevel['dbType']>) => void;
}

export const dispatch_onPermissionAccessLevelChanged = new ThunderDispatcher<OnPermissionAccessLevelUpdated, '__onPermissionAccessLevelUpdated'>('__onPermissionAccessLevelUpdated');

export class ModuleFE_PermissionAccessLevel_Class
	extends ModuleFE_BaseApi<DatabaseDef_PermissionAccessLevel> {

	constructor() {
		super({
			config: buildConfigFromDBDef<DatabaseDef_PermissionAccessLevel>(DBDef_PermissionAccessLevel),
			crudApiDef: CrudApiDef<DatabaseDef_PermissionAccessLevel>(DBDef_PermissionAccessLevel.dbKey),
			dispatcher: (...args) => dispatch_onPermissionAccessLevelChanged.dispatchAll(...args)
		});
	}
}

export const ModuleFE_PermissionAccessLevel = new ModuleFE_PermissionAccessLevel_Class();
