import {CrudApiDef} from '@nu-art/db-api-shared';
import {ModuleBE_BaseApi_Class} from '@nu-art/db-api-backend';
import {ApiHandler} from '@nu-art/http-server';
import {ApiDef_PermissionUser, DBDef_PermissionUser, DatabaseDef_PermissionUser, Request_AssignPermissions} from '@nu-art/permissions-shared';
import {ModuleBE_PermissionUserDB} from './ModuleBE_PermissionUserDB.js';

class ModuleBE_PermissionUserAPI_Class
	extends ModuleBE_BaseApi_Class<DatabaseDef_PermissionUser> {

	constructor() {
		super({
			dbModule: ModuleBE_PermissionUserDB,
			crudApiDef: CrudApiDef<DatabaseDef_PermissionUser>(DBDef_PermissionUser.dbKey),
		});
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

