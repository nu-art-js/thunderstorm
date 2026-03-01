import {ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import type {EventDispatcher} from '@nu-art/db-api-frontend';
import {ApiCallerEventType, CrudApiDef} from '@nu-art/db-api-shared';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {DBDef_PermissionProject, DatabaseDef_PermissionProject} from '@nu-art/permissions-shared';

export interface OnPermissionProjectUpdated {
	__onPermissionProjectUpdated: (...params: ApiCallerEventType<DatabaseDef_PermissionProject['dbType']>) => void;
}

export const dispatch_onPermissionProjectChanged = new ThunderDispatcher<OnPermissionProjectUpdated, '__onPermissionProjectUpdated'>('__onPermissionProjectUpdated');

type DB = DatabaseDef_PermissionProject['dbType'];
const uniqueKeys = (DBDef_PermissionProject.uniqueKeys ?? ['_id']) as DatabaseDef_PermissionProject['uniqueKeys'];
const baseConfig = {
	dbKey: DBDef_PermissionProject.dbKey,
	validator: DBDef_PermissionProject.modifiablePropsValidator,
	uniqueKeys,
	versions: DBDef_PermissionProject.versions,
	dbConfig: {
		name: DBDef_PermissionProject.frontend?.name ?? DBDef_PermissionProject.dbKey,
		group: DBDef_PermissionProject.frontend?.group ?? 'default',
		version: DBDef_PermissionProject.versions[0],
		uniqueKeys: uniqueKeys as (keyof DB)[]
	}
};

export class ModuleFE_PermissionProject_Class
	extends ModuleFE_BaseApi<DatabaseDef_PermissionProject> {

	constructor() {
		const dispatcher: EventDispatcher<DB> = (...args) => {
			dispatch_onPermissionProjectChanged.dispatchUI(...args);
			dispatch_onPermissionProjectChanged.dispatchModule(...args);
		};
		super({
			config: baseConfig,
			crudApiDef: CrudApiDef<DatabaseDef_PermissionProject>(DBDef_PermissionProject.dbKey),
			dispatcher
		});
	}
}

export const ModuleFE_PermissionProject = new ModuleFE_PermissionProject_Class();
