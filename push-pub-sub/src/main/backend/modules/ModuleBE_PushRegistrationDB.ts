import {DBApiConfigV3, ModuleBE_BaseDBV3,} from '@nu-art/thunderstorm/backend';
import {DBDef_PushRegistration, DBProto_PushRegistration} from '../../shared/push-registration';


type Config = DBApiConfigV3<DBProto_PushRegistration> & {
// 	
}

export class ModuleBE_PushRegistrationDB_Class
	extends ModuleBE_BaseDBV3<DBProto_PushRegistration, Config> {

	constructor() {
		super(DBDef_PushRegistration);
	}
}

export const ModuleBE_PushRegistrationDB = new ModuleBE_PushRegistrationDB_Class();
