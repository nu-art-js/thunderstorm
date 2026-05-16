import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DBDef_Message, DatabaseDef_Message} from '@nu-art/ts-messaging-shared';
import {getAuditorId} from '@nu-art/user-account-backend';

export class ModuleBE_MessageDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_Message> {

	constructor() {
		super(DBDef_Message);
	}

	protected async preWriteProcessing(dbInstance: DatabaseDef_Message['uiType'], _originalDbInstance: DatabaseDef_Message['dbType']) {
		if (!dbInstance._auditorId)
			dbInstance._auditorId = await getAuditorId();
	}
}

export const ModuleBE_MessageDB = new ModuleBE_MessageDB_Class();
