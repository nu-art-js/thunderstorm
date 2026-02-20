import {ApiHandler} from '@nu-art/http-server';
import {ModuleBE_BaseApi_Class} from '@nu-art/thunderstorm-backend';
import {ApiDef_PermissionUser, DBProto_PermissionUser, Request_AssignPermissions} from '@nu-art/permissions-shared';
import {ModuleBE_PermissionUserDB} from './ModuleBE_PermissionUserDB.js';

class ModuleBE_PermissionUserAPI_Class
	extends ModuleBE_BaseApi_Class<DBProto_PermissionUser> {

	constructor() {
		super(ModuleBE_PermissionUserDB);
	}

	init() {
		super.init();
	}

	@ApiHandler(ApiDef_PermissionUser.assignPermissions)
	async handleAssignPermissions(body: Request_AssignPermissions): Promise<void> {
		await ModuleBE_PermissionUserDB.assignPermissions(body);
	}
}

export const ModuleBE_PermissionUserAPI = new ModuleBE_PermissionUserAPI_Class();

