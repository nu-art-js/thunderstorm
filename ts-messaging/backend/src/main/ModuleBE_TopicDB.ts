/**
 * Database module for managing topics in the messaging system
 * Provides CRUD operations and database access for topics
 */
import {DBApiConfigV3, ModuleBE_BaseDB,} from '@nu-art/thunder-db-api-backend';
import {DBDef_Topic, DBProto_Topic} from '@nu-art/ts-messaging-shared';


/**
 * Configuration type for the Topic database module
 * Extends the base database config with topic-specific settings
 */
type Config = DBApiConfigV3<DBProto_Topic> & {
// 	
}

/**
 * Backend database module class for topic management
 * Handles database operations for topics using the base DB functionality
 */
export class ModuleBE_TopicDB_Class
	extends ModuleBE_BaseDB<DBProto_Topic, Config> {

	constructor() {
		super(DBDef_Topic);
	}
}

/**
 * Singleton instance of the Topic database module
 */
export const ModuleBE_TopicDB = new ModuleBE_TopicDB_Class();
