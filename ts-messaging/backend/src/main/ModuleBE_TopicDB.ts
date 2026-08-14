import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DBDef_Topic, DatabaseDef_Topic} from '@nu-art/ts-messaging-shared';
import {ModuleBE_MessagingAccess} from './messaging-access-wiring.js';

export class ModuleBE_TopicDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_Topic> {

	constructor() {
		super(DBDef_Topic);
	}

	init() {
		super.init();
		ModuleBE_MessagingAccess.wireTopic(this);
	}
}

export const ModuleBE_TopicDB = new ModuleBE_TopicDB_Class();
