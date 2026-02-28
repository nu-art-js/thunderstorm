import {ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {ApiCallerEventType, CrudApiDef} from '@nu-art/db-api-shared';
import {DispatcherDef, ThunderDispatcherV3} from '@nu-art/thunderstorm-frontend/core/db-api-gen/types';
import {DBDef_PermissionGroup, DatabaseDef_PermissionGroup} from '@nu-art/permissions-shared';

export type DispatcherType_PermissionGroup = DispatcherDef<DatabaseDef_PermissionGroup, `__onPermissionGroupUpdated`>;

export const dispatch_onPermissionGroupChanged = new ThunderDispatcherV3<DispatcherType_PermissionGroup>('__onPermissionGroupUpdated');

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
		super({
			config: baseConfig,
			crudApiDef: CrudApiDef<DatabaseDef_PermissionGroup>(DBDef_PermissionGroup.dbKey),
			dispatcher: (..._params: ApiCallerEventType<DB>) => {
				dispatch_onPermissionGroupChanged.dispatchUI();
				dispatch_onPermissionGroupChanged.dispatchModule();
			}
		});
	}
}

export const ModuleFE_PermissionGroup = new ModuleFE_PermissionGroup_Class();
