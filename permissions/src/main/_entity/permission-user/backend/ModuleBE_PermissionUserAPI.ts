import {addRoutes, createBodyServerApi, ModuleBE_BaseApi_Class} from '@thunder-storm/core/backend';
import {ApiDef_PermissionUser, DBProto_PermissionUser} from './shared';
import {ModuleBE_PermissionUserDB} from './ModuleBE_PermissionUserDB';

class ModuleBE_PermissionUserAPI_Class
	extends ModuleBE_BaseApi_Class<DBProto_PermissionUser> {

	constructor() {
		super(ModuleBE_PermissionUserDB);
	}

	init() {
		super.init();
		addRoutes([createBodyServerApi(ApiDef_PermissionUser._v1.assignPermissions, ModuleBE_PermissionUserDB.assignPermissions)]);
	}
}

export const ModuleBE_PermissionUserAPI = new ModuleBE_PermissionUserAPI_Class();

