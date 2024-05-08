import {DBApiConfigV3, ModuleBE_BaseDB,} from '@nu-art/thunderstorm/backend';
import {DBDef_PushMessagesHistory, DBProto_PushMessagesHistory} from '../../shared/push-messages-history';


type Config = DBApiConfigV3<DBProto_PushMessagesHistory> & {
// 	
}

export class ModuleBE_PushMessagesHistoryDB_Class
	extends ModuleBE_BaseDB<DBProto_PushMessagesHistory, Config> {

	constructor() {
		super(DBDef_PushMessagesHistory);
	}
}

export const ModuleBE_PushMessagesHistoryDB = new ModuleBE_PushMessagesHistoryDB_Class();
