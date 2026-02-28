import {ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {ApiCallerEventType, CrudApiDef} from '@nu-art/db-api-shared';
import {DispatcherDef, ThunderDispatcherV3} from '@nu-art/thunderstorm-frontend/core/db-api-gen/types';
import {DBDef_PermissionDomain, DatabaseDef_PermissionDomain} from '@nu-art/permissions-shared';

export type DispatcherType_PermissionDomain = DispatcherDef<DatabaseDef_PermissionDomain, `__onPermissionDomainUpdated`>;

export const dispatch_onPermissionDomainChanged = new ThunderDispatcherV3<DispatcherType_PermissionDomain>('__onPermissionDomainUpdated');

type DB = DatabaseDef_PermissionDomain['dbType'];
const uniqueKeys = (DBDef_PermissionDomain.uniqueKeys ?? ['_id']) as DatabaseDef_PermissionDomain['uniqueKeys'];
const baseConfig = {
	dbKey: DBDef_PermissionDomain.dbKey,
	validator: DBDef_PermissionDomain.modifiablePropsValidator,
	uniqueKeys,
	versions: DBDef_PermissionDomain.versions,
	dbConfig: {
		name: DBDef_PermissionDomain.frontend?.name ?? DBDef_PermissionDomain.dbKey,
		group: DBDef_PermissionDomain.frontend?.group ?? 'default',
		version: DBDef_PermissionDomain.versions[0],
		uniqueKeys: uniqueKeys as (keyof DB)[]
	}
};

export class ModuleFE_PermissionDomain_Class
	extends ModuleFE_BaseApi<DatabaseDef_PermissionDomain> {

	constructor() {
		super({
			config: baseConfig,
			crudApiDef: CrudApiDef<DatabaseDef_PermissionDomain>(DBDef_PermissionDomain.dbKey),
			dispatcher: (..._params: ApiCallerEventType<DB>) => {
				dispatch_onPermissionDomainChanged.dispatchUI(..._params);
				dispatch_onPermissionDomainChanged.dispatchModule(..._params);
			}
		});
	}
}

export const ModuleFE_PermissionDomain = new ModuleFE_PermissionDomain_Class();
