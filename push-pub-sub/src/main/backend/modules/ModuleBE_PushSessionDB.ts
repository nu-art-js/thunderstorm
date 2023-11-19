import {DBApiConfigV3, ModuleBE_BaseDBV3,} from '@nu-art/thunderstorm/backend';
import {DBDef_PushSession, DBProto_PushSession} from '../../shared/push-session';


type Config = DBApiConfigV3<DBProto_PushSession> & {
// 	
}

export class ModuleBE_PushSessionDB_Class
	extends ModuleBE_BaseDBV3<DBProto_PushSession, Config> {

	constructor() {
		super(DBDef_PushSession);
	}
}

export const ModuleBE_PushSessionDB = new ModuleBE_PushSessionDB_Class();
