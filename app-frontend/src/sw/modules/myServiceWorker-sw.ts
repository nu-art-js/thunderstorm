/*
 * A typescript & react boilerplate with api call example
 *
 * Copyright (C) 2018  Adam van der Kruk aka TacB0sS
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

import {Module} from "@nu-art/ts-common"  ;
// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
import * as firebase from 'firebase/app';
// tslint:disable-next-line:no-import-side-effect
import 'firebase/messaging';

// addEventListener('message', (event) => {
// 	console.log(`The client sent me a message: ${event.data}`);
// });

type FirebaseConfig = {
	apiKey: string
	authDomain: string
	projectId: string
	messagingSenderId: string
	databaseURL?: string
}

export type PushPubSubConfig = {
	config: FirebaseConfig
	publicKeyBase64: string
}


let self: ServiceWorkerGlobalScope;
class PushPubSubModule_Class
	extends Module<PushPubSubConfig> {

	protected init(): void {

		firebase.initializeApp(this.config);

		const messaging = firebase.messaging();
		console.log(messaging);

		messaging.setBackgroundMessageHandler(function (payload: any) {
			console.log('[service worker] Received background message ', payload);

			return self.registration.showNotification('I got');
		});
	}

}

export const PushPubSubModule = new PushPubSubModule_Class()