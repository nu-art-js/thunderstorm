import {ModuleFE_BaseApi, buildConfigFromDBDef} from '@nu-art/db-api-frontend';
import {ApiCallerEventType, CrudApiDef} from '@nu-art/db-api-shared';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {DBDef_PermissionProject, DatabaseDef_PermissionProject} from '@nu-art/permissions-shared';

export interface OnPermissionProjectUpdated {
	__onPermissionProjectUpdated: (...params: ApiCallerEventType<DatabaseDef_PermissionProject['dbType']>) => void;
}

export const dispatch_onPermissionProjectChanged = new ThunderDispatcher<OnPermissionProjectUpdated, '__onPermissionProjectUpdated'>('__onPermissionProjectUpdated');

export class ModuleFE_PermissionProject_Class
	extends ModuleFE_BaseApi<DatabaseDef_PermissionProject> {

	constructor() {
		super({
			config: buildConfigFromDBDef<DatabaseDef_PermissionProject>(DBDef_PermissionProject),
			crudApiDef: CrudApiDef<DatabaseDef_PermissionProject>(DBDef_PermissionProject.dbKey),
			dispatcher: (...args) => dispatch_onPermissionProjectChanged.dispatchAll(...args)
		});
	}
}

export const ModuleFE_PermissionProject = new ModuleFE_PermissionProject_Class();
