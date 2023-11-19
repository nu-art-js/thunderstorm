import {createApisForDBModuleV3, DBApiConfigV3, ModuleBE_BaseDBV3,} from '@nu-art/thunderstorm/backend';
import {DBDef_PushSubscription, DBProto_PushSubscription} from '../../shared/push-subscription';


type Config = DBApiConfigV3<DBProto_PushSubscription> & {
// 	
}

export class ModuleBE_PushSubscriptionDB_Class
	extends ModuleBE_BaseDBV3<DBProto_PushSubscription, Config> {

	constructor() {
		super(DBDef_PushSubscription);
	}
}

export const ModuleBE_PushSubscriptionDB = new ModuleBE_PushSubscriptionDB_Class();

export const ModuleBE_PushSubscriptionAPI = createApisForDBModuleV3(ModuleBE_PushSubscriptionDB);