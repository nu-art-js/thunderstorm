import {ApiDefResolver, BodyApi, HttpMethod} from '@nu-art/thunderstorm';

export type Request_PostMessage = { channel: string, message: any };
export type ApiStruct_Slack = {
	vv1: {
		postMessage: BodyApi<void, Request_PostMessage>
	}
}

export const ApiDef_Slack: ApiDefResolver<ApiStruct_Slack> = {
	vv1: {
		postMessage: {method: HttpMethod.POST, path: 'v1/slack/post-message'},
	}
};