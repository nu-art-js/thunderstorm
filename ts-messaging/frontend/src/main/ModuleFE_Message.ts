/**
 * Frontend module for handling messaging functionality.
 */

import {CrudApiDef, type ApiCallerEventType} from '@nu-art/ts-messaging-shared';
import {buildConfigFromDBDef, EventDispatcher, ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {DBDef_message, DatabaseDef_Message, MessageType_Text} from '@nu-art/ts-messaging-shared';

export type DispatcherType_Message = `__onMessagesUpdated`;

const listeners: Array<EventDispatcher<DatabaseDef_Message['dbType']>> = [];
export const dispatch_onMessagesUpdated = Object.assign(
	((...params: ApiCallerEventType<DatabaseDef_Message['dbType']>) => {
		listeners.forEach(fn => fn(...params));
	}) as EventDispatcher<DatabaseDef_Message['dbType']>,
	{
		addListener(fn: EventDispatcher<DatabaseDef_Message['dbType']>) {
			listeners.push(fn);
		}
	}
);

export class ModuleFE_Message_Class extends ModuleFE_BaseApi<DatabaseDef_Message> {

	constructor() {
		super({
			config: buildConfigFromDBDef<DatabaseDef_Message>(DBDef_message),
			crudApiDef: CrudApiDef<DatabaseDef_Message>(DBDef_message.dbKey),
			dispatcher: dispatch_onMessagesUpdated,
		});
	}

	async createMessage(topicId: string, msg: string) {
		const newMessage = {type: MessageType_Text, topicId, text: msg};
		await this.upsert(newMessage as DatabaseDef_Message['uiType']);
	}
}

export const ModuleFE_Message = new ModuleFE_Message_Class();
