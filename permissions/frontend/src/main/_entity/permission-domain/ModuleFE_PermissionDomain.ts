import {ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import type {EventDispatcher} from '@nu-art/db-api-frontend';
import {ApiCallerEventType, CrudApiDef} from '@nu-art/db-api-shared';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {DBDef_PermissionDomain, DatabaseDef_PermissionDomain} from '@nu-art/permissions-shared';

export interface OnPermissionDomainUpdated {
	__onPermissionDomainUpdated: (...params: ApiCallerEventType<DatabaseDef_PermissionDomain['dbType']>) => void;
}

export const dispatch_onPermissionDomainChanged = new ThunderDispatcher<OnPermissionDomainUpdated, '__onPermissionDomainUpdated'>('__onPermissionDomainUpdated');

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
		const dispatcher: EventDispatcher<DB> = (...args) => {
			dispatch_onPermissionDomainChanged.dispatchUI(...args);
			dispatch_onPermissionDomainChanged.dispatchModule(...args);
		};
		super({
			config: baseConfig,
			crudApiDef: CrudApiDef<DatabaseDef_PermissionDomain>(DBDef_PermissionDomain.dbKey),
			dispatcher
		});
	}
}

export const ModuleFE_PermissionDomain = new ModuleFE_PermissionDomain_Class();
