import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DBDef_message, DatabaseDef_Message} from '@nu-art/ts-messaging-shared';
import {getAuditorId, ModuleBE_AccountDB} from '@nu-art/user-account-backend';
import {arrayToMap} from '@nu-art/ts-common';

export class ModuleBE_MessageDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_Message> {

	constructor() {
		super(DBDef_message);
		this.registerVersionUpgradeProcessor('1.0.0', async items => {
			const emailToAccountMap = arrayToMap(await ModuleBE_AccountDB.query.where({}), _acc => _acc.email);
			items.forEach(_item => {
				const auditorId = _item._auditorId;
				if (auditorId == null || !emailToAccountMap[auditorId])
					return;
				_item._auditorId = emailToAccountMap[auditorId]._id;
			});
		});
	}

	protected async preWriteProcessing(dbInstance: DatabaseDef_Message['uiType'], originalDbInstance: DatabaseDef_Message['dbType']) {
		if (!dbInstance._auditorId)
			dbInstance._auditorId = await getAuditorId();
	}
}

export const ModuleBE_MessageDB = new ModuleBE_MessageDB_Class();
