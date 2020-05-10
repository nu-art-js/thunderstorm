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


// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
import * as firebase from 'firebase/app';
import {Module} from '@nu-art/ts-common/core/module';
import {FirebaseConfig} from "@nu-art/firebase/backend";
import {swSelf} from '@nu-art/thunderstorm/index-sw'

type PushPubSubConfig = {
	config: FirebaseConfig
	publicKeyBase64: string
}

class PushPubSubModule_Class
	extends Module<PushPubSubConfig> {

	protected init(): void {
		const app = firebase.initializeApp(this.config.config);

		import('firebase/messaging').then(() => {
			const messaging = app.messaging();
			this.logVerbose(messaging);

			const mySelf = this;
			messaging.setBackgroundMessageHandler(function (payload: any) {
				console.log('[service worker] Received background message ', payload);

				mySelf.handlePushMessage(payload.data);
				//return swSelf.registration.showNotification()
			});
		}).catch(err => console.log(err))

		addEventListener('message', (event) => {
			this.logInfo(`The client sent me a message:`, event);
			this.handleMessageFromClient(event)
		});
	}

	getClients = async () => swSelf.clients.matchAll({type: "window"});

	sendMessage = async (data: object) => {
		const clients = await this.getClients();

		const message = {
			command: 'SwToApp',
			message: data
		};

		clients.forEach(function (client) {
			client.postMessage(message);
		})
	};

	handlePushMessage = (payload: any) => {
		this.runAsync('Sending message to app', async () => this.sendMessage(payload))
	};

	private handleMessageFromClient(event: MessageEvent) {
		// @ts-ignore
		const respondToEvent = (e: MessageEvent, message: any) => {
			e.ports[0].postMessage(message);
		};
	}
}

export const PushPubSubModule = new PushPubSubModule_Class();

