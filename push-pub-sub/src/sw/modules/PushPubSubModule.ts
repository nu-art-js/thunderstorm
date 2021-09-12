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
// import * as firebase from 'firebase/app';
import {
	Module,
	StringMap
} from "@nu-art/ts-common";
import {FirebaseModule} from "@nu-art/firebase/sw";
import {swSelf} from "@nu-art/thunderstorm/core/self";
import {
	getMessaging,
	onBackgroundMessage
} from "firebase/messaging/sw";

export const Command_SwToApp = "SwToApp";

type PushPubSubConfig = {
	publicKeyBase64: string
}

class PushPubSubModule_Class
	extends Module<PushPubSubConfig> {

	constructor() {
		super("Service Worker PushPubSubModule");
	}

	protected init(): void {
		this.logDebug("Init App in SW");
		const app = FirebaseModule.createSwSession();
		this.logDebug("SW: app session", app);
		const messaging = getMessaging(app);
		this.logDebug("SW: messaging wrapper", messaging);
		onBackgroundMessage(
			messaging, {
				next: this.onNext,
				error: this.logError,
				complete: this.logInfo
			}
		);
	}

	private onNext = (payload: any) => {
		this.runAsync(`Sending message to window ${JSON.stringify(payload.data, null, 2)}`, async () => this.sendMessage(payload.data));
	};

	private getClients = async () => swSelf.clients.matchAll({type: "window", includeUncontrolled: true});

	private sendMessage = async (data: StringMap) => {
		const clients = await this.getClients();
		clients.forEach(function (client) {
			client.postMessage(
				{
					command: Command_SwToApp,
					message: data
				});
		});
	};

	handleMessageFromClient(event: ExtendableMessageEvent) {
		// @ts-ignore
		const respondToEvent = (e: MessageEvent, message: any) => {
			e.ports[0].postMessage(message);
		};
	}
}

export const PushPubSubModule = new PushPubSubModule_Class();

