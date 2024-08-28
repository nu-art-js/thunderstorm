import {DBApiConfigV3, ModuleBE_BaseDB,} from '@thunder-storm/core/backend';
import {DB_PermissionProject, DBDef_PermissionProject, DBProto_PermissionProject} from '../shared';
import {Transaction} from 'firebase-admin/firestore';
import {MemKey_AccountId} from '@thunder-storm/user-account/backend';

type Config = DBApiConfigV3<DBProto_PermissionProject> & {}

export class ModuleBE_PermissionProjectDB_Class
	extends ModuleBE_BaseDB<DBProto_PermissionProject, Config> {

	constructor() {
		super(DBDef_PermissionProject);
	}

	protected async preWriteProcessing(dbInstance: DB_PermissionProject, originalDbInstance: DBProto_PermissionProject['dbType'], t?: Transaction): Promise<void> {
		dbInstance._auditorId = MemKey_AccountId.get();
	}
}

export const ModuleBE_PermissionProjectDB = new ModuleBE_PermissionProjectDB_Class();
