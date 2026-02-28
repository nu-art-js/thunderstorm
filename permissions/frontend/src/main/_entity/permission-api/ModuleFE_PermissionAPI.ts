import {ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {ApiCallerEventType, CrudApiDef} from '@nu-art/db-api-shared';
import {DispatcherDef, ThunderDispatcherV3} from '@nu-art/thunderstorm-frontend/core/db-api-gen/types';
import {DBDef_PermissionAPI, DatabaseDef_PermissionAPI} from '@nu-art/permissions-shared';

export type DispatcherType_PermissionAPI = DispatcherDef<DatabaseDef_PermissionAPI, `__onPermissionAPIUpdated`>;

export const dispatch_onPermissionAPIChanged = new ThunderDispatcherV3<DispatcherType_PermissionAPI>('__onPermissionAPIUpdated');

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
		super({
			config: baseConfig,
			crudApiDef: CrudApiDef<DatabaseDef_PermissionAPI>(DBDef_PermissionAPI.dbKey),
			dispatcher: (..._params: ApiCallerEventType<DB>) => {
				dispatch_onPermissionAPIChanged.dispatchUI();
				dispatch_onPermissionAPIChanged.dispatchModule();
			}
		});
	}
}

export const ModuleFE_PermissionAPI = new ModuleFE_PermissionAPI_Class();
