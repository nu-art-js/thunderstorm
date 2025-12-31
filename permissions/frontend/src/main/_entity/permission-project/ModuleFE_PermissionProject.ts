import {ModuleFE_BaseApi} from '@nu-art/thunderstorm-frontend/index';
import {ApiDefCaller} from '@nu-art/thunder-db-api-shared';
import {DispatcherDef, ThunderDispatcherV3} from '@nu-art/thunder-db-api-frontend';
import {ApiStruct_PermissionProject, DBDef_PermissionProject, DBProto_PermissionProject} from '@nu-art/permissions-shared';


export type DispatcherType_PermissionProject = DispatcherDef<DBProto_PermissionProject, `__onPermissionProjectUpdated`>;

export const dispatch_onPermissionProjectChanged = new ThunderDispatcherV3<DispatcherType_PermissionProject>('__onPermissionProjectUpdated');

export class ModuleFE_PermissionProject_Class
	extends ModuleFE_BaseApi<DBProto_PermissionProject>
	implements ApiDefCaller<ApiStruct_PermissionProject> {

	_v1: ApiDefCaller<ApiStruct_PermissionProject>['_v1'];

	constructor() {
		super(DBDef_PermissionProject, dispatch_onPermissionProjectChanged);
		this._v1 = {};
	}
}

export const ModuleFE_PermissionProject = new ModuleFE_PermissionProject_Class();

