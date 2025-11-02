import {ApiDefResolver, BodyApi, HttpMethod} from '@nu-art/thunderstorm';
import {TSAnalyticsEvent} from './types.js';

export type Analytics_SendEvent = {
	request: {
		event: TSAnalyticsEvent;
	};
	response: void;
};

export type Analytics_UpdateUser = {
	request: {
		mode: 'set' | 'set_once';
		userData: {
			userId: string;
			firstName?: string;
			lastName?: string;
			displayName?: string
			[key: string]: any;
		}
	};
	response: void;
}

export type ApiStruct_Analytics = {
	_v1: {
		sendEvent: BodyApi<Analytics_SendEvent['response'], Analytics_SendEvent['request']>;
		updateUser: BodyApi<Analytics_UpdateUser['response'], Analytics_UpdateUser['request']>;
	}
}

export const ApiDef_Analytics: (baseUrl?: string) => ApiDefResolver<ApiStruct_Analytics> = (baseUrl) => ({
	_v1: {
		sendEvent: {baseUrl, method: HttpMethod.POST, path: '/v1/analytics/send-event'},
		updateUser: {baseUrl, method: HttpMethod.POST, path: '/v1/analytics/update-user'},
	}
});