import {ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import type {EventDispatcher} from '@nu-art/db-api-frontend';
import {ApiCallerEventType, CrudApiDef} from '@nu-art/db-api-shared';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {DBDef_PermissionAccessLevel, DatabaseDef_PermissionAccessLevel} from '@nu-art/permissions-shared';

export interface OnPermissionAccessLevelUpdated {
	__onPermissionAccessLevelUpdated: (...params: ApiCallerEventType<DatabaseDef_PermissionAccessLevel['dbType']>) => void;
}

export const dispatch_onPermissionAccessLevelChanged = new ThunderDispatcher<OnPermissionAccessLevelUpdated, '__onPermissionAccessLevelUpdated'>('__onPermissionAccessLevelUpdated');

type DB = DatabaseDef_PermissionAccessLevel['dbType'];
const uniqueKeys = (DBDef_PermissionAccessLevel.uniqueKeys ?? ['_id']) as DatabaseDef_PermissionAccessLevel['uniqueKeys'];
const baseConfig = {
	dbKey: DBDef_PermissionAccessLevel.dbKey,
	validator: DBDef_PermissionAccessLevel.modifiablePropsValidator,
	uniqueKeys,
	versions: DBDef_PermissionAccessLevel.versions,
	dbConfig: {
		name: DBDef_PermissionAccessLevel.frontend?.name ?? DBDef_PermissionAccessLevel.dbKey,
		group: DBDef_PermissionAccessLevel.frontend?.group ?? 'default',
		version: DBDef_PermissionAccessLevel.versions[0],
		uniqueKeys: uniqueKeys as (keyof DB)[]
	}
};

export class ModuleFE_PermissionAccessLevel_Class
	extends ModuleFE_BaseApi<DatabaseDef_PermissionAccessLevel> {

	constructor() {
		const dispatcher: EventDispatcher<DB> = (...args) => {
			dispatch_onPermissionAccessLevelChanged.dispatchUI(...args);
			dispatch_onPermissionAccessLevelChanged.dispatchModule(...args);
		};
		super({
			config: baseConfig,
			crudApiDef: CrudApiDef<DatabaseDef_PermissionAccessLevel>(DBDef_PermissionAccessLevel.dbKey),
			dispatcher
		});
	}
}

export const ModuleFE_PermissionAccessLevel = new ModuleFE_PermissionAccessLevel_Class();
