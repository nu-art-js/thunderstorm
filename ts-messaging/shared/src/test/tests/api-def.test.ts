import {HttpMethod} from '@nu-art/api-types';
import {ApiDef_Messaging} from '../../main/api-def.js';

describe('ApiDef_Messaging', () => {
	it('getMessages is POST', () => {
		if (ApiDef_Messaging.getMessages.method !== HttpMethod.POST)
			throw new Error(`Expected POST, got ${ApiDef_Messaging.getMessages.method}`);
	});

	it('getMessages has path starting with /', () => {
		if (!ApiDef_Messaging.getMessages.path.startsWith('/'))
			throw new Error(`Expected path to start with "/", got "${ApiDef_Messaging.getMessages.path}"`);
	});

	it('getMessages has correct path', () => {
		if (ApiDef_Messaging.getMessages.path !== '/v1/messaging/messages/query')
			throw new Error(`Expected path "/v1/messaging/messages/query", got "${ApiDef_Messaging.getMessages.path}"`);
	});

	it('getMessages endpoint is fully defined', () => {
		if (!ApiDef_Messaging.getMessages)
			throw new Error('Missing endpoint definition: getMessages');

		if (!ApiDef_Messaging.getMessages.method)
			throw new Error('getMessages missing method');

		if (!ApiDef_Messaging.getMessages.path)
			throw new Error('getMessages missing path');
	});
});
