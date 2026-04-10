import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_UserPermissions, DBDef_UserPermissions, PermissionScope_Permissions} from '@nu-art/permissions-shared';
import {wireScopePermission} from '../../entity-permissions.js';

export class ModuleBE_UserPermissionsDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_UserPermissions> {

	constructor() {
		super(DBDef_UserPermissions);
	}

	init() {
		super.init();
		wireScopePermission(this, PermissionScope_Permissions, 'admin');
	}
}

export const ModuleBE_UserPermissionsDB = new ModuleBE_UserPermissionsDB_Class();
