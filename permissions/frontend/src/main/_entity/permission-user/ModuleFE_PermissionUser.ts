import {apiWithBody, ModuleFE_BaseApi} from '@nu-art/thunderstorm/frontend/index';
import {ApiDefCaller} from '@nu-art/thunderstorm-frontend';
import {DispatcherDef, ThunderDispatcherV3} from '@nu-art/thunderstorm/frontend/core/db-api-gen/types';
import {ApiDef_PermissionUser, ApiStruct_PermissionUser, DBDef_PermissionUser, DBProto_PermissionUser} from '@nu-art/permissions-shared/_entity/permission-user';


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

