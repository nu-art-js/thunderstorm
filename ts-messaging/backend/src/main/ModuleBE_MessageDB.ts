import {DBApiConfigV3, ModuleBE_BaseDB,} from '@nu-art/thunderstorm/backend/index';
import {DBDef_message, DBProto_Message} from '@nu-art/ts-messaging-shared/index';
import {getAuditorId, ModuleBE_AccountDB} from '@nu-art/user-account/backend/index';
import {arrayToMap} from '@nu-art/ts-common';


type Config = DBApiConfigV3<DBProto_Message> & {}

/**
 * Backend database module for managing messages
 * Handles CRUD operations and database access for messages with auditing support
 */
export class ModuleBE_MessageDB_Class
	extends ModuleBE_BaseDB<DBProto_Message, Config> {

	/**
	 * Initializes the message database module
	 * Registers version upgrade processor to convert email-based auditorIds to account _ids
	 */
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

	/**
	 * Pre-write hook that ensures auditor ID is set before saving message
	 *
	 * @param dbInstance - The message instance to be written
	 * @param originalDbInstance - The original message instance from database
	 * @param transaction - Optional Firestore transaction
	 */
	protected async preWriteProcessing(dbInstance: DBProto_Message['uiType'], originalDbInstance: DBProto_Message['dbType'], transaction?: FirebaseFirestore.Transaction) {
		if (!dbInstance._auditorId)
			dbInstance._auditorId = await getAuditorId();
	}
}

export const ModuleBE_MessageDB = new ModuleBE_MessageDB_Class();
