import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_UserPermissions, DBDef_UserPermissions} from '@nu-art/permissions-shared';

export class ModuleBE_UserPermissionsDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_UserPermissions> {

	constructor() {
		super(DBDef_UserPermissions);
	}
}

export const ModuleBE_UserPermissionsDB = new ModuleBE_UserPermissionsDB_Class();
