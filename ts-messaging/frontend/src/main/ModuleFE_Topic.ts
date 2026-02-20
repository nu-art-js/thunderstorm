/**
 * Frontend module for topic management in the messaging system.
 */

import {CrudApiDef, type ApiCallerEventType} from '@nu-art/ts-messaging-shared';
import {DBConfig_ModuleFE, EventDispatcher, ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {DBDef_Topic, DatabaseDef_Topic, UI_Topic} from '@nu-art/ts-messaging-shared';

export type DispatcherType_Topic = `__onTopicsUpdated`;

const listeners: Array<EventDispatcher<DatabaseDef_Topic['dbType']>> = [];
export const dispatch_onTopicsUpdated = Object.assign(
	((...params: ApiCallerEventType<DatabaseDef_Topic['dbType']>) => {
		listeners.forEach(fn => fn(...params));
	}) as EventDispatcher<DatabaseDef_Topic['dbType']>,
	{
		addListener(fn: EventDispatcher<DatabaseDef_Topic['dbType']>) {
			listeners.push(fn);
		}
	}
);

function topicConfig(): DBConfig_ModuleFE<DatabaseDef_Topic> {
	return {
		dbKey: DBDef_Topic.dbKey,
		validator: DBDef_Topic.modifiablePropsValidator,
		uniqueKeys: DBDef_Topic.uniqueKeys ?? [],
		versions: DBDef_Topic.versions,
		dbConfig: {
			...DBDef_Topic.frontend,
			version: DBDef_Topic.versions[0] ?? '1.0.0',
			uniqueKeys: DBDef_Topic.uniqueKeys ?? ['_id'],
		},
	};
}

export class ModuleFE_topic_Class extends ModuleFE_BaseApi<DatabaseDef_Topic> {

	constructor() {
		super({
			config: topicConfig(),
			crudApiDef: CrudApiDef<DatabaseDef_Topic>(DBDef_Topic.dbKey, 'v1'),
			dispatcher: dispatch_onTopicsUpdated,
		});
	}

	getTopics(collectionName: string, refId: string): UI_Topic[] {
		return this.cache.filter(topic => topic.type === collectionName && topic.refId === refId);
	}
}

export const ModuleFE_Topic = new ModuleFE_topic_Class();
