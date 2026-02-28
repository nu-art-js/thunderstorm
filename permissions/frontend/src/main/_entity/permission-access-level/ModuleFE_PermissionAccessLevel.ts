import {ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {ApiCallerEventType, CrudApiDef} from '@nu-art/db-api-shared';
import {DispatcherDef, ThunderDispatcherV3} from '@nu-art/thunderstorm-frontend/core/db-api-gen/types';
import {DBDef_PermissionAccessLevel, DatabaseDef_PermissionAccessLevel} from '@nu-art/permissions-shared';

export type DispatcherType_PermissionAccessLevel = DispatcherDef<DatabaseDef_PermissionAccessLevel, `__onPermissionAccessLevelUpdated`>;

export const dispatch_onPermissionAccessLevelChanged = new ThunderDispatcherV3<DispatcherType_PermissionAccessLevel>('__onPermissionAccessLevelUpdated');

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
		super({
			config: baseConfig,
			crudApiDef: CrudApiDef<DatabaseDef_PermissionAccessLevel>(DBDef_PermissionAccessLevel.dbKey),
			dispatcher: (..._params: ApiCallerEventType<DB>) => {
				dispatch_onPermissionAccessLevelChanged.dispatchUI(..._params);
				dispatch_onPermissionAccessLevelChanged.dispatchModule(..._params);
			}
		});
	}
}

export const ModuleFE_PermissionAccessLevel = new ModuleFE_PermissionAccessLevel_Class();
