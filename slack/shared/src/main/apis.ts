import {ApiDefResolver, BodyApi, HttpMethod} from '@nu-art/api-types';
import {PreSendSlackStructuredMessage} from './types.js';
import {SlackBlock, ThreadPointer} from './base-slack-builder/index.js';
import {WebAPICallResult} from '@slack/web-api';

export type Request_PostMessage = { channel: string, message: any };
export type PostStructuredMessage = {
	request: {
		message: PreSendSlackStructuredMessage,
		thread?: ThreadPointer
	}
	response: {
		threadPointer?: ThreadPointer
	}
}
export type PostFiles = {
	request: { file: any, name: string, thread?: ThreadPointer },
	response: WebAPICallResult
}

export type SendUIMessage = {
	request: { messageBlocks: SlackBlock[], messageReplies: SlackBlock[][], channel?: string },
	response: void
}

export type API_Slack = {
	postMessage: BodyApi<void, Request_PostMessage>,
	postStructuredMessage: BodyApi<PostStructuredMessage['response'], PostStructuredMessage['request']>,
	sendFEMessage: BodyApi<SendUIMessage['response'], SendUIMessage['request']>,
	postFiles: BodyApi<PostFiles['response'], PostFiles['request']>
}

export const ApiDef_Slack: ApiDefResolver<API_Slack> = {
	postMessage: {method: HttpMethod.POST, path: 'v1/slack/post-message'},
	postStructuredMessage: {method: HttpMethod.POST, path: 'v1/slack/post-structured-message'},
	sendFEMessage: {method: HttpMethod.POST, path: 'v1/slack/send-fe-message'},
	postFiles: {method: HttpMethod.POST, path: 'v1/slack/post-files'},
};
