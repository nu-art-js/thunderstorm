import {DBApiConfigV3, ModuleBE_BaseDB} from '@nu-art/thunderstorm/backend';
import {DBDef_LoginAttempt, DBProto_LoginAttempt} from '../shared';


type Config = DBApiConfigV3<DBProto_LoginAttempt> & {
// 	
}

export class ModuleBE_LoginAttemptDB_Class
	extends ModuleBE_BaseDB<DBProto_LoginAttempt, Config> {

	constructor() {
		super(DBDef_LoginAttempt);
	}
}

export const ModuleBE_LoginAttemptDB = new ModuleBE_LoginAttemptDB_Class();
