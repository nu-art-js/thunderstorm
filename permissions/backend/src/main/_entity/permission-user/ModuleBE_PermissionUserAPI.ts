import {CrudApiDef} from '@nu-art/db-api-shared';
import {ModuleBE_BaseApi_Class} from '@nu-art/db-api-backend';
import {ApiHandler} from '@nu-art/http-server';
import {API_PermissionUser, ApiDef_PermissionUser, DBDef_PermissionUser, DatabaseDef_PermissionUser, PermissionScope_Permissions} from '@nu-art/permissions-shared';
import {ModuleBE_PermissionUserDB} from './ModuleBE_PermissionUserDB.js';
import {RequirePermission} from '../../RequirePermission.js';

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

	@RequirePermission(PermissionScope_Permissions, 'write')
	@ApiHandler(ApiDef_PermissionUser.assignPermissions)
	async assignPermissions(body: API_PermissionUser['assignPermissions']['Body']): Promise<void> {
		await ModuleBE_PermissionUserDB.assignPermissions(body);
	}
}

export const ModuleBE_PermissionUserAPI = new ModuleBE_PermissionUserAPI_Class();

