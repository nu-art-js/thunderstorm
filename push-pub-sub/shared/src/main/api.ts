/*
 * A generic push pub sub infra for webapps
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {ApiDefResolver, BodyApi, HttpMethod} from '@nu-art/api-types';
import {BaseSubscriptionData, PushMessage, Request_PushRegister} from './types.js';

export type Request_PushTest = {
	message: PushMessage<any, any, any>;
};

export type API_PushMessages = {
	test: BodyApi<void, Request_PushTest>;
	unregister: BodyApi<BaseSubscriptionData, Request_PushRegister>;
	register: BodyApi<BaseSubscriptionData, Request_PushRegister>;
	registerAll: BodyApi<BaseSubscriptionData[], Request_PushRegister>;
};

export const ApiDef_PushMessages: ApiDefResolver<API_PushMessages> = {
	test: {method: HttpMethod.POST, path: 'v1/push-messages/test'},
	unregister: {method: HttpMethod.POST, path: 'v1/push-messages/unregister'},
	register: {method: HttpMethod.POST, path: 'v1/push-messages/register'},
	registerAll: {method: HttpMethod.POST, path: 'v1/push-messages/register-all'}
};
