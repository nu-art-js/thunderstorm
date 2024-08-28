import {ModuleFE_BaseApi} from '@thunder-storm/core/frontend';
import {DispatcherDef, ThunderDispatcherV3} from '@thunder-storm/core/frontend/core/db-api-gen/types';
import {DBDef_PermissionDomain, DBProto_PermissionDomain} from '../shared';

export type DispatcherType_PermissionDomain = DispatcherDef<DBProto_PermissionDomain, `__onPermissionDomainUpdated`>;

export const dispatch_onPermissionDomainChanged = new ThunderDispatcherV3<DispatcherType_PermissionDomain>('__onPermissionDomainUpdated');

export class ModuleFE_PermissionDomain_Class
	extends ModuleFE_BaseApi<DBProto_PermissionDomain> {

	constructor() {
		super(DBDef_PermissionDomain, dispatch_onPermissionDomainChanged);
	}
}

export const ModuleFE_PermissionDomain = new ModuleFE_PermissionDomain_Class();

