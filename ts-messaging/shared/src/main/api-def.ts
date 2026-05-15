import {ApiDefResolver, BodyApi, HttpMethod} from '@nu-art/api-types';
import {DB_Message} from './message/types.js';
import {UniqueId} from '@nu-art/ts-common';

export type PaginatedMessagesRequest = {
	topicId: UniqueId;
	parentMessageId?: UniqueId;
	cursor?: string;
	limit?: number;
};

export type PaginatedMessagesResponse = {
	messages: DB_Message[];
	nextCursor?: string;
	hasMore: boolean;
};

export type API_Messaging = {
	getMessages: BodyApi<PaginatedMessagesResponse, PaginatedMessagesRequest>;
};

export const ApiDef_Messaging: ApiDefResolver<API_Messaging> = {
	getMessages: {method: HttpMethod.POST, path: 'v1/messaging/messages/query'},
};
