import {DBApiConfigV3, ModuleBE_BaseDBV3,} from '@nu-art/thunderstorm/backend';
import {DBDef_Topic, DBProto_Topic} from '../shared';


type Config = DBApiConfigV3<DBProto_Topic> & {
// 	
}

export class ModuleBE_TopicDB_Class
	extends ModuleBE_BaseDBV3<DBProto_Topic, Config> {

	constructor() {
		super(DBDef_Topic);
	}
}

export const ModuleBE_TopicDB = new ModuleBE_TopicDB_Class();
