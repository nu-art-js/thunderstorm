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

import {PushPubSubModule} from '../modules/PushPubSubModule';
import {FirebaseModule} from '@nu-art/firebase/frontend';
import {NotificationsModule} from '../modules/NotificationModule';


export const ModulePack_Frontend_PushPubSub = [
	FirebaseModule,
	PushPubSubModule,
	NotificationsModule
];

export * from '../modules/PushPubSubModule';
export * from '../modules/NotificationModule';
