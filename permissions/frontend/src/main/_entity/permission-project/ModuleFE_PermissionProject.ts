import {ModuleFE_BaseApi} from '@nu-art/thunderstorm-frontend/index';
import {DispatcherDef, ThunderDispatcherV3} from '@nu-art/thunderstorm-frontend/core/db-api-gen/types';
import {DBDef_PermissionProject, DBProto_PermissionProject} from '@nu-art/permissions-shared';


export type DispatcherType_PermissionProject = DispatcherDef<DBProto_PermissionProject, `__onPermissionProjectUpdated`>;

export const dispatch_onPermissionProjectChanged = new ThunderDispatcherV3<DispatcherType_PermissionProject>('__onPermissionProjectUpdated');

export class ModuleFE_PermissionProject_Class
	extends ModuleFE_BaseApi<DBProto_PermissionProject> {

	constructor() {
		super(DBDef_PermissionProject, dispatch_onPermissionProjectChanged);
	}
}

export const ModuleFE_PermissionProject = new ModuleFE_PermissionProject_Class();

