import {apiWithBody, ModuleFE_BaseApi} from '@thunder-storm/core/frontend';
import {ApiDefCaller} from '@thunder-storm/core';
import {DispatcherDef, ThunderDispatcherV3} from '@thunder-storm/core/frontend/core/db-api-gen/types';
import {ApiDef_PermissionUser, ApiStruct_PermissionUser, DBDef_PermissionUser, DBProto_PermissionUser} from '../shared';


export type DispatcherType_PermissionUser = DispatcherDef<DBProto_PermissionUser, `__onPermissionUserUpdated`>;

export const dispatch_onPermissionUserChanged = new ThunderDispatcherV3<DispatcherType_PermissionUser>('__onPermissionUserUpdated');

export class ModuleFE_PermissionUser_Class
	extends ModuleFE_BaseApi<DBProto_PermissionUser>
	implements ApiDefCaller<ApiStruct_PermissionUser> {

	_v1: ApiDefCaller<ApiStruct_PermissionUser>['_v1'];

	constructor() {
		super(DBDef_PermissionUser, dispatch_onPermissionUserChanged);
		this._v1 = {
			assignPermissions: apiWithBody(ApiDef_PermissionUser._v1.assignPermissions),
		};
	}
}

export const ModuleFE_PermissionUser = new ModuleFE_PermissionUser_Class();

