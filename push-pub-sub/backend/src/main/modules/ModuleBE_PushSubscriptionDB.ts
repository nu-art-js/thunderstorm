import type {DB_Prototype} from '@nu-art/db-api-shared';
import {createApisForDBModule, ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import type {BaseDBDefBE} from '@nu-art/db-api-backend';
import {DatabaseDef_PushSubscription} from '@nu-art/push-pub-sub-shared/push-subscription/types';
import {DBDef_PushSubscription} from '@nu-art/push-pub-sub-shared/push-subscription/db-def';

export class ModuleBE_PushSubscriptionDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_PushSubscription & DB_Prototype, object> {

	constructor() {
		super(DBDef_PushSubscription as unknown as BaseDBDefBE);
	}
}

export const ModuleBE_PushSubscriptionDB = new ModuleBE_PushSubscriptionDB_Class();

export const ModuleBE_PushSubscriptionAPI = createApisForDBModule(ModuleBE_PushSubscriptionDB);