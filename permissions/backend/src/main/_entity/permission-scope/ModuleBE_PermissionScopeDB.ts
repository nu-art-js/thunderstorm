import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DBDef_PermissionScope, DatabaseDef_PermissionScope, PermissionScope_Permissions} from '@nu-art/permissions-shared';
import {wireScopePermission} from '../../entity-permissions.js';

export class ModuleBE_PermissionScopeDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_PermissionScope> {

	constructor() {
		super(DBDef_PermissionScope);
	}

	init() {
		super.init();
		wireScopePermission(this, PermissionScope_Permissions, 'admin');
	}
}

export const ModuleBE_PermissionScopeDB = new ModuleBE_PermissionScopeDB_Class();
