import {ApiDefResolver, BodyApi, HttpMethod} from '@nu-art/thunderstorm';

export type Analytics_SendEvent = {
	request: {};
	response: {};
};

export type ApiStruct_Analytics = {
	_v1: {
		sendEvent: BodyApi<Analytics_SendEvent['response'],Analytics_SendEvent['request']>;
	}
}

export const ApiDef_FocusedObject: ApiDefResolver<ApiStruct_Analytics> = {
	_v1: {
		sendEvent: {method: HttpMethod.POST, path: '/v1/analytics/send-event'},
	}
}