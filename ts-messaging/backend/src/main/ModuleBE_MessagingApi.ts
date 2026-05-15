import {Module} from '@nu-art/ts-common';
import {ApiHandler} from '@nu-art/http-server';
import {RequirePermission} from '@nu-art/permissions-backend';
import {
	API_Messaging,
	ApiDef_Messaging,
	PaginatedMessagesRequest,
	PaginatedMessagesResponse,
	PermissionScope_Messaging,
} from '@nu-art/ts-messaging-shared';
import {ModuleBE_MessageDB} from './ModuleBE_MessageDB.js';

const DefaultPageSize = 50;

export class ModuleBE_MessagingApi_Class
	extends Module {

	constructor() {
		super('MessagingApi');
	}

	@RequirePermission(PermissionScope_Messaging, 'read')
	@ApiHandler(ApiDef_Messaging.getMessages)
	async getMessages(body: API_Messaging['getMessages']['Body']): Promise<PaginatedMessagesResponse> {
		return this.queryMessages(body);
	}

	private async queryMessages(request: PaginatedMessagesRequest): Promise<PaginatedMessagesResponse> {
		const limit = request.limit ?? DefaultPageSize;
		const where: Record<string, any> = {topicId: request.topicId};

		if (request.parentMessageId)
			where.parentMessageId = request.parentMessageId;
		else
			where.parentMessageId = {$exists: false};

		if (request.cursor)
			where.__created = {$lt: Number(request.cursor)};

		const messages = await ModuleBE_MessageDB.query.custom({where: where as any, limit: limit + 1, orderBy: [{key: '__created' as any, order: 'desc'}]});
		const hasMore = messages.length > limit;
		const page = hasMore ? messages.slice(0, limit) : messages;
		const nextCursor = hasMore && page.length > 0 ? String(page[page.length - 1].__created) : undefined;

		return {messages: page, nextCursor, hasMore};
	}
}

export const ModuleBE_MessagingApi = new ModuleBE_MessagingApi_Class();
