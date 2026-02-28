import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DB_PermissionProject, DBDef_PermissionProject, DatabaseDef_PermissionProject} from '@nu-art/permissions-shared';
import {Transaction} from 'firebase-admin/firestore';
import {MemKey_AccountId} from '@nu-art/user-account-backend';
export class ModuleBE_PermissionProjectDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_PermissionProject> {

	constructor() {
		super(DBDef_PermissionProject);
	}

	protected async preWriteProcessing(dbInstance: DB_PermissionProject, originalDbInstance: DatabaseDef_PermissionProject['dbType'], t?: Transaction): Promise<void> {
		dbInstance._auditorId = MemKey_AccountId.get();
	}
}

export const ModuleBE_PermissionProjectDB = new ModuleBE_PermissionProjectDB_Class();
