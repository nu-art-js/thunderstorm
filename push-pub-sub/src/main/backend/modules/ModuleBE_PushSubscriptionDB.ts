import {createApisForDBModuleV3, DBApiConfigV3, ModuleBE_BaseDB,} from '@nu-art/thunderstorm/backend/index';
import {DBDef_PushSubscription, DBProto_PushSubscription} from '../../shared/push-subscription/index.js';


type Config = DBApiConfigV3<DBProto_PushSubscription> & {
// 	
}

export class ModuleBE_PushSubscriptionDB_Class
	extends ModuleBE_BaseDB<DBProto_PushSubscription, Config> {

	constructor() {
		super(DBDef_PushSubscription);
	}
}

export const ModuleBE_PushSubscriptionDB = new ModuleBE_PushSubscriptionDB_Class();

export const ModuleBE_PushSubscriptionAPI = createApisForDBModuleV3(ModuleBE_PushSubscriptionDB);