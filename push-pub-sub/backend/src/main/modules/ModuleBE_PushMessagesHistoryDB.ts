import type {DB_Prototype} from '@nu-art/db-api-shared';
import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import type {BaseDBDefBE} from '@nu-art/db-api-backend';
import {DatabaseDef_PushMessagesHistory} from '@nu-art/push-pub-sub-shared/push-messages-history/types';
import {DBDef_PushMessagesHistory} from '@nu-art/push-pub-sub-shared/push-messages-history/db-def';

export class ModuleBE_PushMessagesHistoryDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_PushMessagesHistory & DB_Prototype, object> {

	constructor() {
		super(DBDef_PushMessagesHistory as unknown as BaseDBDefBE);
	}
}

export const ModuleBE_PushMessagesHistoryDB = new ModuleBE_PushMessagesHistoryDB_Class();
