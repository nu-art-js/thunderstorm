import {ModuleFE_BaseApi} from '@nu-art/thunderstorm-frontend/index';
import {DispatcherDef, ThunderDispatcherV3} from '@nu-art/thunderstorm-frontend/core/db-api-gen/types';
import {DBDef_PermissionDomain, DatabaseDef_PermissionDomain} from '@nu-art/permissions-shared';

export type DispatcherType_PermissionDomain = DispatcherDef<DatabaseDef_PermissionDomain, `__onPermissionDomainUpdated`>;

export const dispatch_onPermissionDomainChanged = new ThunderDispatcherV3<DispatcherType_PermissionDomain>('__onPermissionDomainUpdated');

export class ModuleFE_PermissionDomain_Class
	extends ModuleFE_BaseApi<DatabaseDef_PermissionDomain> {

	constructor() {
		super(DBDef_PermissionDomain, dispatch_onPermissionDomainChanged);
	}
}

export const ModuleFE_PermissionDomain = new ModuleFE_PermissionDomain_Class();

