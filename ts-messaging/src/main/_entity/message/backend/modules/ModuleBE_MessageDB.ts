import {DBApiConfigV3, ModuleBE_BaseDB,} from '@nu-art/thunderstorm/backend';
import {DBDef_message, DBProto_Message} from '../shared';
import {getAuditorId, ModuleBE_AccountDB} from '@nu-art/user-account/backend';
import {arrayToMap} from '@nu-art/ts-common';


type Config = DBApiConfigV3<DBProto_Message> & {}

export class ModuleBE_MessageDB_Class
	extends ModuleBE_BaseDB<DBProto_Message, Config> {

	constructor() {
		super(DBDef_message);
		//Convert existing auditorIds, emails, to be _id instead.
		this.registerVersionUpgradeProcessor('1.0.0', async items => {
			const emailToAccountMap = arrayToMap(await ModuleBE_AccountDB.query.where({}), _acc => _acc.email);
			items.forEach(_item => {
				if (!emailToAccountMap[_item._auditorId])
					return;
				// Only if the existing _auditorId is recognized as an email, replace it with the _id.
				return _item._auditorId = emailToAccountMap[_item._auditorId]._id;
			});
		});
	}

	protected async preWriteProcessing(dbInstance: DBProto_Message['uiType'], transaction?: FirebaseFirestore.Transaction) {
		if (!dbInstance._auditorId)
			dbInstance._auditorId = await getAuditorId();
	}
}

export const ModuleBE_MessageDB = new ModuleBE_MessageDB_Class();
