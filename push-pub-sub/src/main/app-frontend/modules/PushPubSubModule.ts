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
	addItemToArray,
	BadImplementationException,
	compare,
	generateHex,
	ImplementationMissingException,
	Module,
	removeFromArray,
	StringMap
} from "@nu-art/ts-common";

import {
	StorageKey,
	ThunderDispatcher,
	XhrHttpModule
} from "@nu-art/thunderstorm/frontend";
// noinspection TypeScriptPreferShortImport
import {
	BaseSubscriptionData,
	DB_Notifications,
	IFP,
	ISP,
	ITP,
	MessageType,
	PubSubRegisterClient,
	Request_PushRegister,
	SubscribeProps
} from "../../index";
import {HttpMethod} from "@nu-art/thunderstorm";
import {
	FirebaseModule,
	FirebaseSession,
	MessagingWrapper
} from "@nu-art/firebase/frontend";
import {NotificationsModule} from "./NotificationModule";

export const Command_SwToApp = 'SwToApp';

export interface OnPushMessageReceived<M extends MessageType<any, any, any> = never,
	S extends string = IFP<M>,
	P extends SubscribeProps = ISP<M>,
	D = ITP<M>> {
	__onMessageReceived(notification: DB_Notifications): void
}

type FirebaseConfig = {
	apiKey: string
	authDomain: string
	projectId: string
	messagingSenderId: string
	databaseURL?: string
}

export type PushPubSubConfig = {
	config?: FirebaseConfig
	publicKeyBase64: string
	swFileName?: string
	registerOnInit?: boolean
}

export const pushSessionIdKey = 'x-push-session-id';
const pushSessionId = new StorageKey<string>(pushSessionIdKey, false);

export class PushPubSubModule_Class
	extends Module<PushPubSubConfig> {

	private subscriptions: BaseSubscriptionData[] = [];
	private firebaseToken?: string;
	private messaging?: MessagingWrapper;

	private dispatch_pushMessage = new ThunderDispatcher<OnPushMessageReceived<MessageType<any, any, any>>, "__onMessageReceived">("__onMessageReceived");

	private readonly pushSessionId: string;

	constructor() {
		super();
		this.pushSessionId = pushSessionId.get() || pushSessionId.set(generateHex(32));
	}

	init() {
		if (this.config?.registerOnInit === false)
			return;

		this.initApp();
	}

	getPushSessionId() {
		return this.pushSessionId;
	}

	private registerServiceWorker = async () => {
		console.log('registering...');
		return await navigator.serviceWorker.register(`/${this.config.swFileName || 'ts_service_worker.js'}`);
	};

	initApp = () => {
		if (!this.config?.publicKeyBase64)
			throw new ImplementationMissingException(`Please specify the right config for the 'PushPubSubModule'`);


		this.runAsync('Initializing Firebase SDK and registering SW', async () => {
			if ('serviceWorker' in navigator) {
				const asyncs: [Promise<ServiceWorkerRegistration>, Promise<FirebaseSession>] = [
					this.registerServiceWorker(),
					FirebaseModule.createSession()
				];

				const {0: registration, 1: app} = await Promise.all(asyncs);
				await registration.update();
				this.messaging = app.getMessaging();
				// this.messaging.usePublicVapidKey(this.config.publicKeyBase64);
				// await this.messaging.useServiceWorker(registration);
				await this.getToken({vapidKey: this.config.publicKeyBase64, serviceWorkerRegistration: registration});
				if (navigator.serviceWorker.controller) {
					console.log(`This page is currently controlled by: ${navigator.serviceWorker.controller}`);
				}
				navigator.serviceWorker.oncontrollerchange = function () {
					console.log('This page is now controlled by:', navigator.serviceWorker.controller);
				};
				navigator.serviceWorker.onmessage = (event: MessageEvent) => {
					this.processMessageFromSw(event.data);
				};
			}
		});
	};


	// / need to call this from the login verified
	public getToken = async (options?: { vapidKey?: string; serviceWorkerRegistration?: ServiceWorkerRegistration; }) => {
		try {
			this.logVerbose('Checking/Requesting permission...');
			const permission = await Notification.requestPermission();
			this.logVerbose(`Notification permission: ${permission}`);
			if (permission !== 'granted')
				return;

			if (!this.messaging)
				throw new BadImplementationException('I literally just set this!');

			this.firebaseToken = await this.messaging.getToken(options);
			if (!this.firebaseToken)
				return;

			this.messaging.onMessage((payload) => {
				this.processMessage(payload.data);
			});

			this.logVerbose('new token received: ' + this.firebaseToken);

			await this.register();

		} catch (err) {
			this.logError("Unable to get token", err);
		}

	};

	private processMessageFromSw = (data: any) => {
		this.logInfo('Got data from SW: ', data);
		if (!data.command || !data.message || data.command !== Command_SwToApp)
			return;

		this.processMessage(data.message);
	};

	private processMessage = (data: StringMap) => {
		this.logInfo('process message', data);
		const arr: DB_Notifications[] = JSON.parse(data.messages);
		arr.forEach(s => {
			s.persistent && NotificationsModule.addNotification(s);
			this.dispatch_pushMessage.dispatchModule([s]);
		});
	};

	subscribe = async (subscription: BaseSubscriptionData): Promise<void> => {
		this.subscribeImpl(subscription);
		return this.register();
	};

	private subscribeImpl(subscription: BaseSubscriptionData) {
		if (this.subscriptions.find(d => d.pushKey === subscription.pushKey && compare(subscription.props, d.props)))
			return;

		addItemToArray(this.subscriptions, subscription);
	}

	subscribeMulti = async (subscriptions: BaseSubscriptionData[]): Promise<void> => {
		subscriptions.forEach(subscription => this.subscribeImpl(subscription));
		return this.register();
	};

	unsubscribe = async (subscription: BaseSubscriptionData) => {
		removeFromArray(this.subscriptions, d => d.pushKey === subscription.pushKey && compare(subscription.props, d.props));
		return this.register();
	};

	private register = async (): Promise<void> => {
		if (!this.firebaseToken)
			return this.logWarning("No Firebase token...");

		const body: Request_PushRegister = {
			firebaseToken: this.firebaseToken,
			pushSessionId: this.pushSessionId,
			subscriptions: this.subscriptions.map(({pushKey, props}) => ({pushKey, props}))
		};

		await new Promise<void>((resolve) => {
			this.debounce(async () => {
				const response = await XhrHttpModule
					.createRequest<PubSubRegisterClient>(HttpMethod.POST, 'register-pub-sub-tab')
					.setRelativeUrl("/v1/push/register")
					.setJsonBody(body)
					.setOnError("Failed to register for push")
					.executeSync();

				NotificationsModule.setNotificationList(response);
				this.logVerbose('Finished register PubSub');
				resolve();
			}, 'push-registration', 800);

		});
	};
}

export const PushPubSubModule = new PushPubSubModule_Class();