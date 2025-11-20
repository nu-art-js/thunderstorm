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
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');
import {initializeApp} from 'firebase/app';
import {getMessaging, onBackgroundMessage} from 'firebase/messaging/sw';
import {BeLogged, LogClient_Browser, Logger, LogLevel} from '@nu-art/ts-common';


export class FCMServiceWorker
	extends Logger {
	constructor() {
		super();
		this.setMinLevel(LogLevel.Debug);
	}

	init(firebaseConfig: any) {
		this.logVerbose('INIT');
		if (!firebaseConfig)
			throw new Error('forgot to add ModuleFE_Firebase.local to your config');

		this.logVerbose('START');
		const firebaseApp = initializeApp(firebaseConfig);
		const messaging = getMessaging(firebaseApp);

		onBackgroundMessage(messaging, (payload) => {
			this.logDebug('[service_worker.js] Received background message ', payload);
			const message = {
				command: 'SwToApp',
				message: payload.data
			};

			// @ts-ignore
			self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(clients => {
				// @ts-ignore
				clients.forEach(function (client) {
					client.postMessage(message);
				});
			});
		});

		this.logVerbose('Registering listeners');
		self.addEventListener('notificationclick', this.onNotificationClicked);
		self.addEventListener('pushsubscriptionchange', this.onSubscriptionChanged);
		self.addEventListener('push', this.onPushReceived);
		self.addEventListener('activate', this.onActivate);
		self.addEventListener('install', this.onInstall);
		this.logVerbose('SW DONE');
	}

	onPushReceived = (e: any) => {
		this.logDebug('push in SW', e);
	};

	onActivate = async () => {
		this.logVerbose('Activated SW');
		try {
			// @ts-ignore
			await self.clients.claim();
			this.logDebug('Service Worker activated');
		} catch (e: any) {
			this.logError('Error activating service worker', e);
		}
	};

	onInstall = async () => {
		this.logVerbose('Installed SW');
		try {
			// @ts-ignore
			await self.skipWaiting();
			this.logDebug('Skipped waiting, now using the new SW');
		} catch (e: any) {
			this.logError('Something wrong while skipping waiting. Service worker not queued', e);
		}
	};

	onNotificationClicked = () => {
		this.logDebug('Notification Clicked in SW');
	};

	onSubscriptionChanged = () => {
		this.logDebug('onSubscriptionChanged in SW');
	};
}

BeLogged.addClient(LogClient_Browser);