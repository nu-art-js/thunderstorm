import {ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {ApiCallerEventType, CrudApiDef} from '@nu-art/db-api-shared';
import {DispatcherDef, ThunderDispatcherV3} from '@nu-art/thunderstorm-frontend/core/db-api-gen/types';
import {DBDef_PermissionProject, DatabaseDef_PermissionProject} from '@nu-art/permissions-shared';

export type DispatcherType_PermissionProject = DispatcherDef<DatabaseDef_PermissionProject, `__onPermissionProjectUpdated`>;

export const dispatch_onPermissionProjectChanged = new ThunderDispatcherV3<DispatcherType_PermissionProject>('__onPermissionProjectUpdated');

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
		super({
			config: baseConfig,
			crudApiDef: CrudApiDef<DatabaseDef_PermissionProject>(DBDef_PermissionProject.dbKey),
			dispatcher: (..._params: ApiCallerEventType<DB>) => {
				dispatch_onPermissionProjectChanged.dispatchUI(..._params);
				dispatch_onPermissionProjectChanged.dispatchModule(..._params);
			}
		});
	}
}

export const ModuleFE_PermissionProject = new ModuleFE_PermissionProject_Class();
