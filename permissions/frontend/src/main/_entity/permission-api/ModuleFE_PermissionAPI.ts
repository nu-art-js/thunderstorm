import {ModuleFE_BaseApi, buildConfigFromDBDef} from '@nu-art/db-api-frontend';
import {ApiCallerEventType, CrudApiDef} from '@nu-art/db-api-shared';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {DBDef_PermissionAPI, DatabaseDef_PermissionAPI} from '@nu-art/permissions-shared';

export interface OnPermissionAPIUpdated {
	__onPermissionAPIUpdated: (...params: ApiCallerEventType<DatabaseDef_PermissionAPI['dbType']>) => void;
}

export const dispatch_onPermissionAPIChanged = new ThunderDispatcher<OnPermissionAPIUpdated, '__onPermissionAPIUpdated'>('__onPermissionAPIUpdated');

export class ModuleFE_PermissionAPI_Class
	extends ModuleFE_BaseApi<DatabaseDef_PermissionAPI> {

	constructor() {
		super({
			config: buildConfigFromDBDef<DatabaseDef_PermissionAPI>(DBDef_PermissionAPI),
			crudApiDef: CrudApiDef<DatabaseDef_PermissionAPI>(DBDef_PermissionAPI.dbKey),
			dispatcher: (...args) => dispatch_onPermissionAPIChanged.dispatchAll(...args)
		});
	}
}

export const ModuleFE_PermissionAPI = new ModuleFE_PermissionAPI_Class();
