import type {DB_Prototype} from '@nu-art/db-api-shared';
import {CrudApiDef} from '@nu-art/db-api-shared';
import type {ApiCallerEventType} from '@nu-art/db-api-shared';
import {buildConfigFromDBDef, ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {DatabaseDef_PushSubscription} from '@nu-art/push-pub-sub-shared/push-subscription/types';
import {DBDef_PushSubscription} from '@nu-art/push-pub-sub-shared/push-subscription/db-def';
import {ThunderDispatcher} from '@nu-art/thunder-core';

/** Event type for subscription updates. Uses any for DB type to bridge ts-common DB_PushSubscription with db-api DB_Object. */
export interface OnSubscriptionUpdated {
	__onSubscriptionUpdated(...params: ApiCallerEventType<any>): void;
}

export const dispatch_onSubscriptionChanged = new ThunderDispatcher<OnSubscriptionUpdated, '__onSubscriptionUpdated'>('__onSubscriptionUpdated');

export class ModuleFE_PushSubscription_Class
	extends ModuleFE_BaseApi<DatabaseDef_PushSubscription & DB_Prototype> {

	constructor() {
		super({
			config: buildConfigFromDBDef<DatabaseDef_PushSubscription & DB_Prototype>(DBDef_PushSubscription as any),
			crudApiDef: CrudApiDef<DatabaseDef_PushSubscription & DB_Prototype>(DBDef_PushSubscription.dbKey),
			dispatcher: (...params) => dispatch_onSubscriptionChanged.dispatchAll(...params)
		});
	}
}

export const ModuleFE_PushSubscription = new ModuleFE_PushSubscription_Class();
