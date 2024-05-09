import {ModuleFE_BaseApi} from '@nu-art/thunderstorm/frontend';
import {DispatcherDef, ThunderDispatcherV3} from '@nu-art/thunderstorm/frontend/core/db-api-gen/types';
import {DBDef_PushSubscription, DBProto_PushSubscription} from '../../shared/push-subscription';


export const dispatch_onSubscriptionChanged = new ThunderDispatcherV3<DispatcherDef<DBProto_PushSubscription, `__onSubscriptionUpdated`>>('__onSubscriptionUpdated');

export class ModuleFE_PushSubscription_Class
	extends ModuleFE_BaseApi<DBProto_PushSubscription> {

	constructor() {
		super(DBDef_PushSubscription, dispatch_onSubscriptionChanged);
	}
}

export const ModuleFE_PushSubscription = new ModuleFE_PushSubscription_Class();

