/**
 * Database module for managing topics in the messaging system
 * Provides CRUD operations and database access for topics
 */
import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DBDef_Topic, DatabaseDef_Topic} from '@nu-art/ts-messaging-shared';

export class ModuleBE_TopicDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_Topic> {

	constructor() {
		super(DBDef_Topic);
	}
}

/**
 * Singleton instance of the Topic database module
 */
export const ModuleBE_TopicDB = new ModuleBE_TopicDB_Class();
