/*
 * Firebase is a simpler Typescript wrapper to all of firebase services.
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

import {Logger} from "@nu-art/ts-common";
import {FirebaseType_Messaging} from "./types";
// tslint:disable:no-import-side-effect
import 'firebase/messaging';

export class MessagingWrapper
	extends Logger {

	private readonly messaging: FirebaseType_Messaging;

	constructor(messaging: FirebaseType_Messaging) {
		super();
		this.messaging = messaging;
	}

	/** @deprecated */
	usePublicVapidKey(vapidKey: string) {
		this.messaging.usePublicVapidKey(vapidKey);
	}

	async getToken(options?: {
		vapidKey?: string;
		serviceWorkerRegistration?: ServiceWorkerRegistration;
	}) {
		return this.messaging.getToken(options);
	}

	/** @deprecated */
	useServiceWorker(registration: ServiceWorkerRegistration) {
		this.messaging.useServiceWorker(registration);
	}

	/** @deprecated */
	onTokenRefresh(callback: () => void) {
		return this.messaging.onTokenRefresh(callback)
	}

	onMessage(callback: (payload: any) => void) {
		return this.messaging.onMessage(callback)
	}
}