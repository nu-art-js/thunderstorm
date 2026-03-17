import {ModuleFE_BaseApi, buildConfigFromDBDef} from '@nu-art/db-api-frontend';
import {ApiCallerEventType, CrudApiDef} from '@nu-art/db-api-shared';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {DBDef_PermissionDomain, DatabaseDef_PermissionDomain} from '@nu-art/permissions-shared';

export interface OnPermissionDomainUpdated {
	__onPermissionDomainUpdated: (...params: ApiCallerEventType<DatabaseDef_PermissionDomain['dbType']>) => void;
}

export const dispatch_onPermissionDomainChanged = new ThunderDispatcher<OnPermissionDomainUpdated, '__onPermissionDomainUpdated'>('__onPermissionDomainUpdated');

export class ModuleFE_PermissionDomain_Class
	extends ModuleFE_BaseApi<DatabaseDef_PermissionDomain> {

	constructor() {
		super({
			config: buildConfigFromDBDef<DatabaseDef_PermissionDomain>(DBDef_PermissionDomain),
			crudApiDef: CrudApiDef<DatabaseDef_PermissionDomain>(DBDef_PermissionDomain.dbKey),
			dispatcher: (...args) => dispatch_onPermissionDomainChanged.dispatchAll(...args)
		});
	}
}

export const ModuleFE_PermissionDomain = new ModuleFE_PermissionDomain_Class();
