import {ModuleFE_BaseApi, buildConfigFromDBDef} from '@nu-art/db-api-frontend';
import {ApiCallerEventType, CrudApiDef} from '@nu-art/db-api-shared';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {DBDef_PermissionScope, DatabaseDef_PermissionScope} from '@nu-art/permissions-shared';

export interface OnPermissionScopeUpdated {
	__onPermissionScopeUpdated: (...params: ApiCallerEventType<DatabaseDef_PermissionScope['dbType']>) => void;
}

export const dispatch_onPermissionScopeChanged = new ThunderDispatcher<OnPermissionScopeUpdated, '__onPermissionScopeUpdated'>('__onPermissionScopeUpdated');

export class ModuleFE_PermissionScope_Class
	extends ModuleFE_BaseApi<DatabaseDef_PermissionScope> {

	constructor() {
		super({
			config: buildConfigFromDBDef<DatabaseDef_PermissionScope>(DBDef_PermissionScope),
			crudApiDef: CrudApiDef<DatabaseDef_PermissionScope>(DBDef_PermissionScope.dbKey),
			dispatcher: (...args) => dispatch_onPermissionScopeChanged.dispatchAll(...args)
		});
	}
}

export const ModuleFE_PermissionScope = new ModuleFE_PermissionScope_Class();
