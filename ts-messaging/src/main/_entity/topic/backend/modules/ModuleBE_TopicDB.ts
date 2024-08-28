import {DBApiConfigV3, ModuleBE_BaseDB,} from '@thunder-storm/core/backend';
import {DBDef_Topic, DBProto_Topic} from '../shared';


type Config = DBApiConfigV3<DBProto_Topic> & {
// 	
}

export class ModuleBE_TopicDB_Class
	extends ModuleBE_BaseDB<DBProto_Topic, Config> {

	constructor() {
		super(DBDef_Topic);
	}
}

export const ModuleBE_TopicDB = new ModuleBE_TopicDB_Class();
