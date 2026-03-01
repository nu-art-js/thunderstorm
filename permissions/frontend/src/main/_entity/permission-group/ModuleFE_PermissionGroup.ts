import {ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import type {EventDispatcher} from '@nu-art/db-api-frontend';
import {ApiCallerEventType, CrudApiDef} from '@nu-art/db-api-shared';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {DBDef_PermissionGroup, DatabaseDef_PermissionGroup} from '@nu-art/permissions-shared';

export interface OnPermissionGroupUpdated {
	__onPermissionGroupUpdated: (...params: ApiCallerEventType<DatabaseDef_PermissionGroup['dbType']>) => void;
}

export const dispatch_onPermissionGroupChanged = new ThunderDispatcher<OnPermissionGroupUpdated, '__onPermissionGroupUpdated'>('__onPermissionGroupUpdated');

type DB = DatabaseDef_PermissionGroup['dbType'];
const uniqueKeys = (DBDef_PermissionGroup.uniqueKeys ?? ['_id']) as DatabaseDef_PermissionGroup['uniqueKeys'];
const baseConfig = {
	dbKey: DBDef_PermissionGroup.dbKey,
	validator: DBDef_PermissionGroup.modifiablePropsValidator,
	uniqueKeys,
	versions: DBDef_PermissionGroup.versions,
	dbConfig: {
		name: DBDef_PermissionGroup.frontend?.name ?? DBDef_PermissionGroup.dbKey,
		group: DBDef_PermissionGroup.frontend?.group ?? 'default',
		version: DBDef_PermissionGroup.versions[0],
		uniqueKeys: uniqueKeys as (keyof DB)[]
	}
};

export class ModuleFE_PermissionGroup_Class
	extends ModuleFE_BaseApi<DatabaseDef_PermissionGroup> {

	constructor() {
		const dispatcher: EventDispatcher<DB> = (...args) => {
			dispatch_onPermissionGroupChanged.dispatchUI(...args);
			dispatch_onPermissionGroupChanged.dispatchModule(...args);
		};
		super({
			config: baseConfig,
			crudApiDef: CrudApiDef<DatabaseDef_PermissionGroup>(DBDef_PermissionGroup.dbKey),
			dispatcher
		});
	}
}

export const ModuleFE_PermissionGroup = new ModuleFE_PermissionGroup_Class();
