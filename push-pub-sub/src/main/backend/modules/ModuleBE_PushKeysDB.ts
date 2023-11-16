import {DBApiConfigV3, ModuleBE_BaseDBV3,} from '@nu-art/thunderstorm/backend';
import {DBDef_PushKeys, DBProto_PushKeys} from '../../shared/push-key';


type Config = DBApiConfigV3<DBProto_PushKeys> & {
// 	
}

export class ModuleBE_PushKeysDB_Class
	extends ModuleBE_BaseDBV3<DBProto_PushKeys, Config> {

	constructor() {
		super(DBDef_PushKeys);
	}
}

export const ModuleBE_PushKeysDB = new ModuleBE_PushKeysDB_Class();
