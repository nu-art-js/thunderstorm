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

import {ModuleBE_PushPubSub} from '../modules/ModuleBE_PushPubSub';
import {ModuleBE_PushSubscriptionAPI, ModuleBE_PushSubscriptionDB} from '../modules/ModuleBE_PushSubscriptionDB';
import {ModuleBE_PushSessionDB} from '../modules/ModuleBE_PushSessionDB';
import {ModuleBE_PushMessagesHistoryDB} from '../modules/ModuleBE_PushMessagesHistoryDB';


export const ModulePackBE_PushPubSub = [
	ModuleBE_PushPubSub,
	ModuleBE_PushSubscriptionDB,
	ModuleBE_PushSubscriptionAPI,
	ModuleBE_PushMessagesHistoryDB,
	ModuleBE_PushSessionDB,
];

export * from '../modules/ModuleBE_PushPubSub';
export * from '../modules/PushKey';
