import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DBDef_PermissionScope, DatabaseDef_PermissionScope} from '@nu-art/permissions-shared';

export class ModuleBE_PermissionScopeDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_PermissionScope> {

	constructor() {
		super(DBDef_PermissionScope);
	}
}

export const ModuleBE_PermissionScopeDB = new ModuleBE_PermissionScopeDB_Class();
