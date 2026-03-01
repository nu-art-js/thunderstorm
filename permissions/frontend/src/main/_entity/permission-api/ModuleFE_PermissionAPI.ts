import {ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import type {EventDispatcher} from '@nu-art/db-api-frontend';
import {ApiCallerEventType, CrudApiDef} from '@nu-art/db-api-shared';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {DBDef_PermissionAPI, DatabaseDef_PermissionAPI} from '@nu-art/permissions-shared';

export interface OnPermissionAPIUpdated {
	__onPermissionAPIUpdated: (...params: ApiCallerEventType<DatabaseDef_PermissionAPI['dbType']>) => void;
}

export const dispatch_onPermissionAPIChanged = new ThunderDispatcher<OnPermissionAPIUpdated, '__onPermissionAPIUpdated'>('__onPermissionAPIUpdated');

type DB = DatabaseDef_PermissionAPI['dbType'];
const uniqueKeys = (DBDef_PermissionAPI.uniqueKeys ?? ['_id']) as DatabaseDef_PermissionAPI['uniqueKeys'];
const baseConfig = {
	dbKey: DBDef_PermissionAPI.dbKey,
	validator: DBDef_PermissionAPI.modifiablePropsValidator,
	uniqueKeys,
	versions: DBDef_PermissionAPI.versions,
	dbConfig: {
		name: DBDef_PermissionAPI.frontend?.name ?? DBDef_PermissionAPI.dbKey,
		group: DBDef_PermissionAPI.frontend?.group ?? 'default',
		version: DBDef_PermissionAPI.versions[0],
		uniqueKeys: uniqueKeys as (keyof DB)[]
	}
};

export class ModuleFE_PermissionAPI_Class
	extends ModuleFE_BaseApi<DatabaseDef_PermissionAPI> {

	constructor() {
		const dispatcher: EventDispatcher<DB> = (...args) => {
			dispatch_onPermissionAPIChanged.dispatchUI(...args);
			dispatch_onPermissionAPIChanged.dispatchModule(...args);
		};
		super({
			config: baseConfig,
			crudApiDef: CrudApiDef<DatabaseDef_PermissionAPI>(DBDef_PermissionAPI.dbKey),
			dispatcher
		});
	}
}

export const ModuleFE_PermissionAPI = new ModuleFE_PermissionAPI_Class();
