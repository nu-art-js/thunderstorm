/*
 * A typescript & react boilerplate with api call example
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
import {initializeApp} from "firebase/app";
import {getMessaging, onBackgroundMessage} from "firebase/messaging/sw";

const firebaseConfig = require('../main/config').config?.FirebaseModule?.local;

enum LogLevel {
	INFO,
	ERROR
}

class FCMServiceWorker {
	myLog(level: LogLevel, ...text: any[]) {
		const color = level === LogLevel.INFO ? 'orange' : 'red';
		for (const t of text) {
			if (typeof t === "object")
				console.log(t);
			else
				console.log('%c ' + t, `color: ${color};`);
		}
	}

	logError(...text: any[]) {
		this.myLog(LogLevel.ERROR, ...text);
	}

	logInfo = (...text: any[]) => {
		this.myLog(LogLevel.INFO, ...text);
	};

	init() {
		this.logInfo("INIT");
		if (!firebaseConfig)
			throw new Error("forgot to add FirebaseModule.local to your config");

		this.logInfo("Registering listeners");
		self.addEventListener("notificationclick", this.onNotificationClicked);
		self.addEventListener("pushsubscriptionchange", this.onSubscriptionChanged);
		self.addEventListener("push", this.onPushReceived);
		self.addEventListener("activate", this.onActivate);
		self.addEventListener("install", this.onInstall);

		return this;
	}

	onPushReceived = (e: any) => {
		this.logInfo('push in SW', e);
	};

	onActivate = async () => {
		this.logInfo('Activated SW');
		try {
			// @ts-ignore
			await self.clients.claim();
			this.logInfo('Service Worker activated');
		} catch (e) {
			this.logError('Error activating service worker', e);
		}
	};

	onInstall = async () => {
		this.logInfo('Installed SW');
		try {
			// @ts-ignore
			await self.skipWaiting.claim();
			this.logInfo('Skipped waiting, now using the new SW');
		} catch (e) {
			this.logError('Something wrong while skipping waiting. Service worker not queued', e);
		}
	};

	onNotificationClicked = () => {
		this.logInfo('Notification Clicked in SW');
	};

	onSubscriptionChanged = () => {
		this.logInfo('onSubscriptionChanged in SW');
	};

	start() {
		this.logInfo("START");
		const firebaseApp = initializeApp(firebaseConfig);
		const messaging = getMessaging(firebaseApp);

		onBackgroundMessage(messaging, (payload) => {
			this.logInfo('[service_worker.js] Received background message ', payload);
			const message = {
				command: 'SwToApp',
				message: payload.data
			};

			// @ts-ignore
			self.clients.matchAll({type: "window", includeUncontrolled: true}).then(clients => {
				// @ts-ignore
				clients.forEach(function (client) {
					client.postMessage(message);
				});
			});
		});
	}
}

new FCMServiceWorker().init().start();