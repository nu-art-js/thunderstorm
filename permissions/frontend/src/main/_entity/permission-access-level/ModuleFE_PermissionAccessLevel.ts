import {ModuleFE_BaseApi} from '@nu-art/thunderstorm-frontend';
import {DispatcherDef, ThunderDispatcherV3} from '@nu-art/thunderstorm-frontend/core/db-api-gen/types';
import {DBDef_PermissionAccessLevel, DatabaseDef_PermissionAccessLevel} from '@nu-art/permissions-shared';


export type DispatcherType_PermissionAccessLevel = DispatcherDef<DatabaseDef_PermissionAccessLevel, `__onPermissionAccessLevelUpdated`>;

export const dispatch_onPermissionAccessLevelChanged = new ThunderDispatcherV3<DispatcherType_PermissionAccessLevel>('__onPermissionAccessLevelUpdated');

export class ModuleFE_PermissionAccessLevel_Class
	extends ModuleFE_BaseApi<DatabaseDef_PermissionAccessLevel> {

	constructor() {
		super(DBDef_PermissionAccessLevel, dispatch_onPermissionAccessLevelChanged);
	}

}

export const ModuleFE_PermissionAccessLevel = new ModuleFE_PermissionAccessLevel_Class();

