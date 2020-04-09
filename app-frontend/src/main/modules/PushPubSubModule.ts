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

import {
	__stringify,
	_clearTimeout,
	_setTimeout,
	addItemToArray,
	compare,
	generateHex,
	ImplementationMissingException,
	Module,
	Second,
	StringMap
} from "@nu-art/ts-common";

import {
	HttpModule,
	HttpRequest,
	ThunderDispatcher,
	ToastModule
} from "@nu-art/thunderstorm/frontend";
import {HttpMethod} from "@nu-art/thunderstorm";

import * as firebase from 'firebase/app';
// tslint:disable-next-line:no-import-side-effect
import 'firebase/messaging';
import {
	PubSubRegisterClient,
	PubSubSubscription,
	Request_PushRegister
} from "@nu-art/push-pub-sub";

export interface OnFirebaseMessageReceived {
	onMessageReceived(payload: StringMap): void
}

export interface OnFirebaseTokenRefreshed {
	onTokenRefreshed(uuid: string, token: string): void

	onTokenRefreshError(error: any): void

	// onPermissionsRequired()
}

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


export class PushPubSubModule_Class
	extends Module<PushPubSubConfig> {

	private readonly sessionId: string = generateHex(64);
	private subscriptions: PubSubSubscription[] = []
	private registerRequest?: HttpRequest<any>;
	private firebaseToken?: string;
	private timeout?: number;
	private messaging!: firebase.messaging.Messaging;

	private dispatch_pushMessage = new ThunderDispatcher<OnFirebaseMessageReceived, "onMessageReceived">("onMessageReceived");
	private dispatch_tokenRefreshed = new ThunderDispatcher<OnFirebaseTokenRefreshed, "onTokenRefreshed">("onTokenRefreshed");
	private dispatch_tokenRefreshError = new ThunderDispatcher<OnFirebaseTokenRefreshed, "onTokenRefreshError">("onTokenRefreshError");

	init() {
		if (!this.config?.config || !this.config.publicKeyBase64)
			throw new ImplementationMissingException(`Please specify the right config for the 'PushPubSubModule'`);


		// this.dispatch_permissionsRequired = new Dispatcher<OnFirebaseTokenRefreshed>("onPermissionsRequired");

		const app = firebase.initializeApp(this.config.config);

		this.messaging = app.messaging();
		this.messaging.usePublicVapidKey(this.config.publicKeyBase64);

		if('serviceWorker' in navigator)
			navigator
				.serviceWorker
				.register('./service_worker.js')
				.then((registration) => {
					console.log('registering service worker...',registration);
					this.messaging.useServiceWorker(registration);
					// Request permission and get token.....
				}).catch(e => {
				console.log('some error in registering',e);
			});
		// this.messaging.useServiceWorker(MyServiceWorker)

	}

	// / need to call this from the login verified
	public getToken = () => {
		this.runAsync("Getting firebase token", async () => {
			try {
				this.logInfo('Checking/Requesting permission...');
				const permission = await Notification.requestPermission();
				this.logInfo(`Notification permission: ${permission}`);
				if (permission !== 'granted')
					return;

				this.firebaseToken = await this.messaging.getToken();
				if (!this.firebaseToken)
					return;

				this.register();
				this.logInfo('new token received: ' + this.firebaseToken);
				this.messaging.onTokenRefresh(this.getToken);
				this.dispatch_tokenRefreshed.dispatchModule([this.sessionId, this.firebaseToken]);
				console.log('setting onMessage');
				this.messaging.onMessage((payload) => {
					this.logInfo(`Message received. ${__stringify(payload, true)}`);
					this.dispatch_pushMessage.dispatchModule([payload]);
				});
				console.log('onMessage set');
			} catch (err) {
				this.logError("Unable to get token", err);
				this.dispatch_tokenRefreshError.dispatchModule([err]);
			}
		});
	};

	subscribe = (subscription: PubSubSubscription) => {
		if (this.subscriptions.find(d => d.pushKey === subscription.pushKey && compare(subscription.props, d.props)))
			return;

		addItemToArray(this.subscriptions, subscription)
		this.register();
	};

	private register = () => {
		if (this.timeout)
			_clearTimeout(this.timeout)

		this.timeout = _setTimeout(() => {
			if (!this.firebaseToken || this.subscriptions.length === 0)
				return;

			if (this.registerRequest)
				this.registerRequest.abort();

			const body: Request_PushRegister = {
				sessionId: this.sessionId,
				firebaseToken: this.firebaseToken,
				subscriptions: this.subscriptions.map(({pushKey, props}) => ({pushKey, props}))
			}

			this.registerRequest = HttpModule
				.createRequest<PubSubRegisterClient>(HttpMethod.POST, 'register-pub-sub-tab')
				.setRelativeUrl("/v1/push/register")
				.setJsonBody(body)
				.setOnError(() => ToastModule.toastError("Failed to register for push"))
				.execute()
		}, Second)

	};
}

// export class MyServiceWorker_Class
// 	extends ServiceWorkerRegistration {
// 	readonly active: ServiceWorker | null = new ServiceWorker();
// 	readonly installing: ServiceWorker | null = null;
// 	readonly navigationPreload: NavigationPreloadManager;
// 	onupdatefound: ((this: ServiceWorkerRegistration, ev: Event) => any) | null;
// 	readonly pushManager: PushManager;
// 	readonly scope: string;
// 	readonly sync: SyncManager;
// 	readonly updateViaCache: ServiceWorkerUpdateViaCache;
// 	readonly waiting: ServiceWorker | null;
// 	getNotifications(filter?: GetNotificationOptions): Promise<Notification[]>;
// 	showNotification(title: string, options?: NotificationOptions): Promise<void>;
// 	unregister(): Promise<boolean>;
// 	update(): Promise<void>;
// 	addEventListener<K extends keyof ServiceWorkerRegistrationEventMap>(type: K, listener: (this: ServiceWorkerRegistration, ev: ServiceWorkerRegistrationEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
// 	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
// 	removeEventListener<K extends keyof ServiceWorkerRegistrationEventMap>(type: K, listener: (this: ServiceWorkerRegistration, ev: ServiceWorkerRegistrationEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
// 	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
// }

// export const MyServiceWorker = new MyServiceWorker_Class();

export const PushPubSubModule = new PushPubSubModule_Class();