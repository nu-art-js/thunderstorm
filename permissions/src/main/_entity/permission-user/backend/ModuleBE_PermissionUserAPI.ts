import {addRoutes, createBodyServerApi, ModuleBE_BaseApi_Class} from '@nu-art/thunderstorm/backend/index';
import {ApiDef_PermissionUser, DBProto_PermissionUser} from './shared.js';
import {ModuleBE_PermissionUserDB} from './ModuleBE_PermissionUserDB.js';

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

