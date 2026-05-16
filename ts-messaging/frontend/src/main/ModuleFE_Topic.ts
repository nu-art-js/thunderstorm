import {CrudApiDef} from '@nu-art/db-api-shared';
import type {ApiCallerEventType} from '@nu-art/db-api-shared';
import {buildConfigFromDBDef, ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {DatabaseDef_Topic, DBDef_Topic, DB_Topic} from '@nu-art/ts-messaging-shared';
import type {DBPointer} from '@nu-art/ts-common';

export interface OnTopicsUpdated {
	__onTopicsUpdated: (...params: ApiCallerEventType<DatabaseDef_Topic['dbType']>) => void;
}

export const dispatch_onTopicsUpdated = new ThunderDispatcher<OnTopicsUpdated, '__onTopicsUpdated'>('__onTopicsUpdated');

export class ModuleFE_Topic_Class
	extends ModuleFE_BaseApi<DatabaseDef_Topic> {

	constructor() {
		super({
			config: buildConfigFromDBDef<DatabaseDef_Topic>(DBDef_Topic),
			crudApiDef: CrudApiDef<DatabaseDef_Topic>(DBDef_Topic.dbKey),
			dispatcher: (...args) => dispatch_onTopicsUpdated.dispatchAll(...args),
		});
	}

	getTopicByAnchor(anchor: DBPointer): DB_Topic | undefined {
		return this.cache.find(topic => topic.anchor.dbKey === anchor.dbKey && topic.anchor.id === anchor.id);
	}
}

export const ModuleFE_Topic = new ModuleFE_Topic_Class();
