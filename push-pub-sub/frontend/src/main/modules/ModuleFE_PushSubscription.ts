import type {ApiCallerEventType, DB_Prototype} from '@nu-art/db-api-shared';
import {CrudApiDef} from '@nu-art/db-api-shared';
import type {EventDispatcher} from '@nu-art/db-api-frontend';
import {ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {DBDef_PushSubscription, DatabaseDef_PushSubscription} from '@nu-art/push-pub-sub-shared/push-subscription/index';
import {ThunderDispatcher} from '@nu-art/thunder-core';

/** Event type for subscription updates. Uses any for DB type to bridge ts-common DB_PushSubscription with db-api DB_Object. */
export interface OnSubscriptionUpdated {
	__onSubscriptionUpdated(...params: ApiCallerEventType<any>): void;
}

export const dispatch_onSubscriptionChanged = new ThunderDispatcher<OnSubscriptionUpdated, '__onSubscriptionUpdated'>('__onSubscriptionUpdated');

const pushSubscriptionDispatcher: EventDispatcher<(DatabaseDef_PushSubscription & DB_Prototype)['dbType']> = (...params) => {
	dispatch_onSubscriptionChanged.dispatchUI(...params);
};

const pushSubscriptionConfig = {
	dbKey: DBDef_PushSubscription.dbKey,
	validator: DBDef_PushSubscription.modifiablePropsValidator,
	uniqueKeys: (DBDef_PushSubscription.uniqueKeys ?? ['_id']) as (DatabaseDef_PushSubscription & DB_Prototype)['uniqueKeys'],
	versions: DBDef_PushSubscription.versions,
	dbConfig: {
		name: DBDef_PushSubscription.frontend?.name ?? DBDef_PushSubscription.dbKey,
		group: DBDef_PushSubscription.frontend?.group ?? 'default',
		version: DBDef_PushSubscription.versions[0],
		uniqueKeys: (DBDef_PushSubscription.uniqueKeys ?? ['_id']) as (keyof (DatabaseDef_PushSubscription['dbType']))[]
	}
};

export class ModuleFE_PushSubscription_Class
	extends ModuleFE_BaseApi<DatabaseDef_PushSubscription & DB_Prototype> {

	constructor() {
		super({
			config: pushSubscriptionConfig,
			crudApiDef: CrudApiDef<DatabaseDef_PushSubscription & DB_Prototype>(DBDef_PushSubscription.dbKey),
			dispatcher: pushSubscriptionDispatcher
		});
	}
}

export const ModuleFE_PushSubscription = new ModuleFE_PushSubscription_Class();
