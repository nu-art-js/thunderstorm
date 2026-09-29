import {CrudApiDef} from '@nu-art/db-api-shared';
import type {ApiCallerEventType} from '@nu-art/db-api-shared';
import {buildConfigFromDBDef, ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {ApiCaller} from '@nu-art/http-client';
import {
	API_Messaging,
	ApiDef_Messaging,
	AssetRef,
	DatabaseDef_Message,
	DBDef_Message,
	DB_Message,
	PaginatedMessagesResponse,
} from '@nu-art/ts-messaging-shared';
import {sortArray, type UniqueId} from '@nu-art/ts-common';

export interface OnMessagesUpdated {
	__onMessagesUpdated: (...params: ApiCallerEventType<DatabaseDef_Message['dbType']>) => void;
}

export const dispatch_onMessagesUpdated = new ThunderDispatcher<OnMessagesUpdated, '__onMessagesUpdated'>('__onMessagesUpdated');

export class ModuleFE_Message_Class
	extends ModuleFE_BaseApi<DatabaseDef_Message> {

	constructor() {
		super({
			config: buildConfigFromDBDef<DatabaseDef_Message>(DBDef_Message),
			crudApiDef: CrudApiDef<DatabaseDef_Message>(DBDef_Message.dbKey),
			dispatcher: (...args) => dispatch_onMessagesUpdated.dispatchAll(...args),
		});
	}

	async createMessage(topicId: UniqueId, text?: string, attachments?: AssetRef[], parentMessageId?: UniqueId) {
		const newMessage: DatabaseDef_Message['uiType'] = {topicId} as DatabaseDef_Message['uiType'];
		if (text !== undefined)
			newMessage.text = text;
		if (attachments !== undefined)
			newMessage.attachments = attachments;
		if (parentMessageId !== undefined)
			newMessage.parentMessageId = parentMessageId;
		return this.upsert(newMessage);
	}

	listTopicMessages(topicId: UniqueId, parentMessageId?: UniqueId): DB_Message[] {
		return sortArray(
			this.cache.all().filter(message =>
				message.topicId === topicId
				&& (parentMessageId ? message.parentMessageId === parentMessageId : !message.parentMessageId)),
			message => message.__created ?? 0,
		);
	}

	async getMessagesForTopic(body: API_Messaging['getMessages']['Body']): Promise<PaginatedMessagesResponse> {
		const response = await this.fetchMessages(body);
		if (response.messages.length)
			await this.onEntriesUpdated(response.messages);
		return response;
	}

	@ApiCaller(ApiDef_Messaging.getMessages)
	async fetchMessages(body: API_Messaging['getMessages']['Body']): Promise<PaginatedMessagesResponse> {
		void body;
		return undefined as unknown as PaginatedMessagesResponse;
	}

	async getThreadReplies(topicId: UniqueId, parentMessageId: UniqueId, cursor?: string): Promise<PaginatedMessagesResponse> {
		return this.getMessagesForTopic({topicId, parentMessageId, cursor});
	}
}

export const ModuleFE_Message = new ModuleFE_Message_Class();
