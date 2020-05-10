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

import {
	PubSubRegisterClient,
	PubSubSubscription,
	Request_PushRegister
} from "../..";
import {
	ApiWithQuery,
	HttpMethod
} from "@nu-art/thunderstorm";

export interface OnFirebaseMessageReceived {
	onMessageReceived(payload: StringMap): void
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

	private subscriptions: PubSubSubscription[] = []
	private registerRequest?: HttpRequest<any>;
	private firebaseToken?: string;
	private timeout?: number;
	private messaging!: firebase.messaging.Messaging;
	// private appInitialized: boolean = false;

	private dispatch_pushMessage = new ThunderDispatcher<OnFirebaseMessageReceived, "onMessageReceived">("onMessageReceived");

	init() {
		if (!this.config?.publicKeyBase64)
			throw new ImplementationMissingException(`Please specify the right config for the 'PushPubSubModule'`);

		this.runAsync('Initializing app with default configs', this.initApp)
	}

	private getApp = async () => {
		const firebase = await import('firebase/app');

		const config = await this.getConfig()
		return firebase.initializeApp(config);
	};

	private getConfig = async () => {
		if (this.config.config)
			return this.config.config;

		try {
			return await HttpModule
				.createRequest<ApiWithQuery<string, FirebaseConfig>>(HttpMethod.GET, 'get-firebase-config')
				.setUrl('/__/firebase/init.json')
				.executeSync();
		} catch (e) {
			throw new ImplementationMissingException(`Either specify configs for the 'PushPubSubModule' or use SDK auto-configuration with firebase hosting`)
		}
	};

	private registerServiceWorker = async () => {
		const registration = await navigator.serviceWorker.register('/service_worker.js');
		console.log('Service worker registered', registration);
		return registration;
	};

	private initApp = async () => {
		if ('serviceWorker' in navigator) {
			const asyncs: Promise<any>[] = [
				this.registerServiceWorker(),
				this.getApp()
			];

			const {0: registration, 1: app} = await Promise.all(asyncs);

			await import('firebase/messaging');

			this.messaging = app.messaging();
			this.messaging.usePublicVapidKey(this.config.publicKeyBase64);
			this.messaging.useServiceWorker(registration);

			this.getToken();

			navigator.serviceWorker.onmessage = (event: MessageEvent) => {
				console.log('message received from service worker', event);
			};
		}
	};

	// / need to call this from the login verified
	public getToken = () => {
		this.runAsync("Getting firebase token", async () => {
			try {
				this.logInfo('Checking/Requesting permission...');
				const permission = await Notification.requestPermission();
				this.logInfo(`Notification permission: ${permission}`);
				if (permission !== 'granted')
					return;

				if (!this.messaging)
					return;

				this.firebaseToken = await this.messaging.getToken();
				if (!this.firebaseToken)
					return;

				this.register();
				this.logInfo('new token received: ' + this.firebaseToken);
				this.messaging.onTokenRefresh(this.getToken);

				this.messaging.onMessage((payload) => {
					this.logInfo(`Message received. ${__stringify(payload, true)}`);
					this.dispatch_pushMessage.dispatchModule([payload]);
				});

			} catch (err) {
				this.logError("Unable to get token", err);
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

export const PushPubSubModule = new PushPubSubModule_Class();