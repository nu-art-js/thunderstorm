import {ModuleFE_BaseApi} from '@thunder-storm/core/frontend';
import {ApiDefCaller} from '@thunder-storm/core';
import {DispatcherDef, ThunderDispatcherV3} from '@thunder-storm/core/frontend/core/db-api-gen/types';
import {ApiStruct_PermissionProject, DBDef_PermissionProject, DBProto_PermissionProject} from '../shared';


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

