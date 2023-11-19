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

import {addItemToArray, compare, generateHex, ImplementationMissingException, Module, removeFromArray, ThisShouldNotHappenException} from '@nu-art/ts-common';
import {apiWithBody, StorageKey, ThunderDispatcher} from '@nu-art/thunderstorm/frontend';
import {
	ApiDef_PushMessages,
	ApiStruct_PushMessages,
	BaseSubscriptionData,
	PushMessage,
	PushMessage_Payload,
	PushMessage_PayloadWrapper,
	Request_PushRegister
} from '../../index';
import {ApiDefCaller} from '@nu-art/thunderstorm';
import {MessagingWrapperFE, ModuleFE_Firebase} from '@nu-art/firebase/frontend';


export const Command_SwToApp = 'SwToApp';

export interface OnPushMessageReceived<MessageType extends PushMessage<any, any, any> = PushMessage<any, any, any>> {
	__onMessageReceived(notification: PushMessage_Payload<MessageType>): void;
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

export class ModuleFE_PushPubSub_Class
	extends Module<PushPubSubConfig>
	implements ApiDefCaller<ApiStruct_PushMessages> {

	private subscriptions: BaseSubscriptionData[] = [];
	private firebaseToken?: string;
	private messaging!: MessagingWrapperFE;

	private dispatch_pushMessage = new ThunderDispatcher<OnPushMessageReceived, '__onMessageReceived'>('__onMessageReceived');

	readonly v1: ApiDefCaller<ApiStruct_PushMessages>['v1'];

	private readonly pushSessionId: string;
	protected timeout: number = 800;

	constructor() {
		super();
		window.name = window.name || generateHex(32);
		this.pushSessionId = pushSessionId.set(window.name);
		const register = apiWithBody(ApiDef_PushMessages.v1.register);
		this.v1 = {
			test: apiWithBody(ApiDef_PushMessages.v1.test),
			register: (subscription: BaseSubscriptionData) => {
				this.subscribeImpl(subscription);
				return register(this.composeRegisterRequest());
			},
			unregister: (subscription: BaseSubscriptionData) => {
				removeFromArray(this.subscriptions, d => d.topic === subscription.topic && compare(subscription.filter, d.filter));
				return register(this.composeRegisterRequest());
			},
			registerAll: (subscriptions: BaseSubscriptionData[]) => {
				subscriptions.forEach(subscription => this.subscribeImpl(subscription));
				return register(this.composeRegisterRequest());
			}
		};
	}

	private composeRegisterRequest() {
		if (!this.firebaseToken)
			throw new ThisShouldNotHappenException('Firebase token not found');

		const body: Request_PushRegister = {
			firebaseToken: this.firebaseToken,
			pushSessionId: this.getPushSessionId(),
			subscriptions: this.subscriptions.map(({topic, filter}) => ({topic, filter}))
		};
		return body;
	}

	init() {
		if (this.config?.registerOnInit === false)
			return;

		if (!this.config?.publicKeyBase64)
			throw new ImplementationMissingException(`ModuleFE_PushPubSub config is missing the publicKeyBase64`);

		this.initApp();
	}

	getPushSessionId() {
		return this.pushSessionId;
	}

	private registerServiceWorker = async () => {
		if (!('serviceWorker' in navigator)) {
			this.logWarning('serviceWorker property is missing in navigator');
			return undefined;
		}

		const registration = await navigator.serviceWorker.register(`/${this.config.swFileName || 'pubsub-sw.js'}`);
		await registration.update();
		navigator.serviceWorker.oncontrollerchange = () => {
			this.logDebug('This page is now controlled by:', this.getControllingServiceWorker());
		};

		navigator.serviceWorker.onmessage = (event: MessageEvent) => {
			this.processMessageFromSw(event.data);
		};

		return registration;
	};

	initApp = () => {
		this.runAsync('Initializing Firebase SDK and registering SW', async () => {
			const registration = await this.registerServiceWorker();
			const session = await ModuleFE_Firebase.createSession();

			this.messaging = session.getMessaging();
			this.messaging.onMessage((payload) => {
				if (!payload.data)
					return this.logInfo('No data passed to the message handler, I got this', payload);

				this.processMessage(payload.data as PushMessage_PayloadWrapper);
			});

			this.logDebug('Getting new Token');
			await this.getToken({vapidKey: this.config?.publicKeyBase64, serviceWorkerRegistration: registration});
			this.logDebug('GOT new Token');

			if (this.getControllingServiceWorker()) {
				this.logDebug(`This page is currently controlled by: `, this.getControllingServiceWorker());
			}
		});
	};

	private getControllingServiceWorker() {
		return navigator.serviceWorker.controller;
	}

	public deleteToken() {
		return this.messaging.deleteToken();
	}

	isNotificationEnabled() {
		return Notification.permission === 'granted';
	}

	requestPermissions = async () => {
		if (this.isNotificationEnabled())
			return this.logVerbose('Notification already allowed');

		const permission = await Notification.requestPermission();
		if (permission !== 'granted')
			return this.logWarning('Notification was NOT granted');

		return this.logVerbose('Notification WAS granted');
	};

	public getToken = async (options?: { vapidKey?: string; serviceWorkerRegistration?: ServiceWorkerRegistration; }) => {
		if (!this.isNotificationEnabled())
			return;

		this.firebaseToken = await this.messaging.getToken(options);
		this.logVerbose('new token received: ' + this.firebaseToken);
	};
	hasToken = () => !!this.firebaseToken;
	private processMessageFromSw = (data: any) => {
		this.logDebug('Got message from service worker: ', data);
		if (!data.command || !data.message || data.command !== Command_SwToApp)
			return;

		this.processMessage(data.message);
	};

	private processMessage = (data: PushMessage_PayloadWrapper) => {
		if (data.sessionId !== this.pushSessionId)
			return;

		this.logInfo('process message', data);
		const payload: PushMessage_Payload = JSON.parse(data.payload);
		this.dispatch_pushMessage.dispatchAll(payload);
	};

	private subscribeImpl(subscription: BaseSubscriptionData) {
		if (this.subscriptions.find(d => d.topic === subscription.topic && compare(subscription.filter, d.filter)))
			return;

		addItemToArray(this.subscriptions, subscription);
	}
}

export const ModuleFE_PushPubSub = new ModuleFE_PushPubSub_Class();