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

import {ApiDefResolver, BodyApi, HttpMethod} from '@thunder-storm/core';
import {BaseSubscriptionData, PushMessage, Request_PushRegister} from './types';


export type Request_PushTest = {
	message: PushMessage<any, any, any>
}

export type ApiStruct_PushMessages = {
	v1: {
		test: BodyApi<void, Request_PushTest>
		unregister: BodyApi<void, Request_PushRegister, BaseSubscriptionData>
		register: BodyApi<void, Request_PushRegister, BaseSubscriptionData>
		registerAll: BodyApi<void, Request_PushRegister, BaseSubscriptionData[]>
	}
}

export const ApiDef_PushMessages: ApiDefResolver<ApiStruct_PushMessages> = {
	v1: {
		test: {method: HttpMethod.POST, path: 'v1/push-messages/test'},
		unregister: {method: HttpMethod.POST, path: 'v1/push-messages/unregister'},
		register: {method: HttpMethod.POST, path: 'v1/push-messages/register'},
		registerAll: {method: HttpMethod.POST, path: 'v1/push-messages/register-all'}
	}
};