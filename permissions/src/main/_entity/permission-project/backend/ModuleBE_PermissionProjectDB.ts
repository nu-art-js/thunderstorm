import {DBApiConfigV3, ModuleBE_BaseDB,} from '@nu-art/thunderstorm/backend';
import {DBDef_PermissionProject, DBProto_PermissionProject, DB_PermissionProject} from '../shared';
import {Transaction} from 'firebase-admin/firestore';
import {MemKey_AccountId} from '@nu-art/user-account/backend';

type Config = DBApiConfigV3<DBProto_PermissionProject> & {}

export class ModuleBE_PermissionProjectDB_Class
	extends ModuleBE_BaseDB<DBProto_PermissionProject, Config> {

	constructor() {
		super(DBDef_PermissionProject);
	}

	protected async preWriteProcessing(dbInstance: DB_PermissionProject, t?: Transaction): Promise<void> {
		dbInstance._auditorId = MemKey_AccountId.get();
	}
}

export const ModuleBE_PermissionProjectDB = new ModuleBE_PermissionProjectDB_Class();
