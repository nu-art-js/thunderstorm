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

import {PushMessage} from '../../shared';
import {ModuleBE_PushPubSub} from './ModuleBE_PushPubSub';


export class PushKey_BE<MessageType extends PushMessage<any, any, any>> {

	private readonly topic: MessageType['topic'];

	constructor(topic: MessageType['topic']) {
		this.topic = topic;
	}

	async push(data: MessageType['data'], filter?: MessageType['filter']) {
		return ModuleBE_PushPubSub.pushToKey({topic: this.topic, filter, data});
	}
}

