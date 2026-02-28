import {ModuleFE_BaseApi} from '@nu-art/thunderstorm-frontend/index';
import {DispatcherDef, ThunderDispatcherV3} from '@nu-art/thunderstorm-frontend/core/db-api-gen/types';
import {DBDef_PermissionGroup, DatabaseDef_PermissionGroup} from '@nu-art/permissions-shared';

export type DispatcherType_PermissionGroup = DispatcherDef<DatabaseDef_PermissionGroup, `__onPermissionGroupUpdated`>;

export const dispatch_onPermissionGroupChanged = new ThunderDispatcherV3<DispatcherType_PermissionGroup>('__onPermissionGroupUpdated');

export class ModuleFE_PermissionGroup_Class
	extends ModuleFE_BaseApi<DatabaseDef_PermissionGroup> {

	constructor() {
		super(DBDef_PermissionGroup, dispatch_onPermissionGroupChanged);
	}
}

export const ModuleFE_PermissionGroup = new ModuleFE_PermissionGroup_Class();

