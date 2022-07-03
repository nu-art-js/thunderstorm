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

import {TS_Object} from '@nu-art/ts-common';
import {PushPubSubModule} from './PushPubSubModule';
import {SubscribeProps} from './_imports';


export class PushKey<K extends string, P extends SubscribeProps, D extends TS_Object> {

	private readonly key: K;

	constructor(key: K) {
		this.key = key;
	}

	async push(data: D, props?: P) {
		return PushPubSubModule.pushToKey(this.key, props, data);
	}
}
