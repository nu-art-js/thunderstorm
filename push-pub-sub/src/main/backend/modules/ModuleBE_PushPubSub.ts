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

import {__stringify, batchActionParallel, compare, currentTimeMillis, Day, filterDuplicates, generateHex, Module} from '@nu-art/ts-common';

import {FirebaseType_BatchResponse, FirebaseType_Message, ModuleBE_Firebase, PushMessagesWrapperBE} from '@nu-art/firebase/backend';
import {ApiDef_PushMessages, DB_Notifications, DB_PushKeys, MessageDef, PushMessage, Request_PushRegister} from '../../index';

import {addRoutes, createBodyServerApi, OnCleanupSchedulerAct} from '@nu-art/thunderstorm/backend';

import {MemKey_AccountId} from '@nu-art/user-account/backend';
import {firestore} from 'firebase-admin';
import {UI_PushRegistration} from '../../shared/push-registration';
import {ModuleBE_PushRegistrationDB} from './ModuleBE_PushRegistrationDB';
import {ModuleBE_PushKeysDB} from './ModuleBE_PushKeysDB';
import Transaction = firestore.Transaction;


type Config = {
	notificationsCleanupTime?: number
	sessionsCleanupTime?: number
};

type TempMessages = {
	[token: string]: DB_Notifications[]
};

export class ModuleBE_PushPubSub_Class
	extends Module<Config>
	implements OnCleanupSchedulerAct {

	// private pushSessions!: FirestoreCollection<DB_PushSession>;
	// private pushKeys!: FirestoreCollection<DB_PushKeys>;
	private messaging!: PushMessagesWrapperBE;

	constructor() {
		super();
	}

	protected init(): void {
		super.init();
		const session = ModuleBE_Firebase.createAdminSession();

		this.messaging = session.getMessaging();

		addRoutes([
			createBodyServerApi(ApiDef_PushMessages.v1.test, (r) => this.pushToKey(r.message)),
			createBodyServerApi(ApiDef_PushMessages.v1.register, this.register),
			createBodyServerApi(ApiDef_PushMessages.v1.unregister, this.register),
			createBodyServerApi(ApiDef_PushMessages.v1.registerAll, this.register)
		]);
	}

	register = async (body: Request_PushRegister) => {
		const accountId = MemKey_AccountId.get();
		const session: UI_PushRegistration = {
			firebaseToken: body.firebaseToken,
			pushSessionId: body.pushSessionId,
			timestamp: currentTimeMillis(),
			accountId
		};

		await ModuleBE_PushRegistrationDB.collection.uniqueGetOrCreate({pushSessionId: session.pushSessionId}, async () => session);

		const subscriptions: DB_PushKeys[] = body.subscriptions.map((s): DB_PushKeys => {
			const sub: DB_PushKeys = {
				pushSessionId: body.pushSessionId,
				pushKey: s.pushKey
			};
			if (s.props)
				sub.props = s.props;

			return sub;
		});

		await ModuleBE_PushKeysDB.runTransaction(async transaction => {
			const data = await ModuleBE_PushKeysDB.query.where({pushSessionId: body.pushSessionId});
			const toInsert = subscriptions.filter(s => !data.find(d => d.pushKey === s.pushKey && compare(s.props, d.props)));
			if (toInsert.length === 0)
				return;

			this.logWarning(`Subscribe on: `, toInsert);
			return ModuleBE_PushKeysDB.create.all(toInsert);
		});
	};

	async pushToKey<Def extends MessageDef<any, any, any>>(message: PushMessage<Def>, transaction?: Transaction) {
		return ModuleBE_PushKeysDB.runTransaction(async (_transaction: Transaction) => {
			let docs = await ModuleBE_PushKeysDB.query.where({pushKey: message.topic});
			if (message.props)
				docs = docs.filter(doc => !doc.props || compare(doc.props, message.props));

			const notification = this.buildNotification(message.topic, message.data, message.props);
			if (docs.length === 0)
				return;

			const sessionsIds = docs.map(d => d.pushSessionId);
			// I get the tokens relative to those sessions (query)
			this.logDebug(
				`Sending push to: \n Sessions: ${JSON.stringify(sessionsIds)}\n Key: ${message.topic}\n Props: ${JSON.stringify(message.props)} \n Data: ${JSON.stringify(message.data)}`);

			const sessions = await batchActionParallel(sessionsIds, 10, async elements => ModuleBE_PushRegistrationDB.query.where({pushSessionId: {$in: elements}}, transaction));
			const _messages = docs.reduce((carry: TempMessages, db_pushKey: DB_PushKeys) => {
				const session = sessions.find(s => s.pushSessionId === db_pushKey.pushSessionId);
				if (!session)
					return carry;

				carry[session.firebaseToken] = [notification];

				return carry;
			}, {} as TempMessages);
			const resp = await this.sendMessage(_messages);
			if (!resp)
				return this.logInfo('No messages to send. Empty subscriptions');

			const {response, messages} = resp;
			this.logInfo(`${response.successCount} sent, ${response.failureCount} failed`, 'messages', messages);
			// return this.cleanUp(response, messages);
		}, transaction);
	}

	async pushToUser<Def extends MessageDef<any, any, any>>(accountId: string, message: PushMessage<Def>) {
		this.logInfo('i am pushing to user...', accountId, message.props);

		const notification = this.buildNotification(message.topic, message.data, message.props, accountId);

		const docs = await ModuleBE_PushRegistrationDB.query.where({accountId});
		if (docs.length === 0)
			return;

		const sessionsIds = docs.map(d => d.pushSessionId);
		const sessions = await batchActionParallel(sessionsIds, 10, async elements =>
			ModuleBE_PushRegistrationDB.query.where({pushSessionId: {$in: elements}}));

		const _messages = docs.reduce((carry: TempMessages, db_pushKey) => {
			const session = sessions.find(s => s.pushSessionId === db_pushKey.pushSessionId);
			if (!session)
				return carry;

			carry[session.firebaseToken] = [notification];

			return carry;
		}, {} as TempMessages);

		await this.sendMessage(_messages);
	}

	private buildNotification = (pushkey: string, data?: any, props?: any, user?: string) => {
		const now = currentTimeMillis();
		const notification: DB_Notifications = {
			_id: generateHex(16),
			__created: now,
			__updated: now,
			timestamp: now,
			read: false,
			pushKey: pushkey,
		};

		if (data)
			notification.data = data;

		if (props)
			notification.props = props;

		if (user)
			notification.userId = user;

		return notification;
	};

	sendMessage = async (_messages: TempMessages): Promise<{
		response: FirebaseType_BatchResponse,
		messages: FirebaseType_Message[]
	} | undefined> => {
		const messages: FirebaseType_Message[] = Object.keys(_messages).map(token => ({
			token,
			data: {messages: __stringify(_messages[token])}
		}));
		if (messages.length === 0)
			return;

		this.logInfo('sending a message to \n' + Object.keys(_messages).join('\n'));
		const response: FirebaseType_BatchResponse = await this.messaging.sendAll(messages);
		this.logInfo('and this is the response: ' + response.responses.map(_response => _response.success));
		return {response, messages};
	};

	__onCleanupSchedulerAct = () => {
		return {
			cleanup: this.scheduledCleanup,
			interval: Day,
			moduleKey: this.getName()
		};
	};

	scheduledCleanup = async () => {
		const sessionsCleanupTime = this.config?.sessionsCleanupTime || Day;
		const docs = await ModuleBE_PushRegistrationDB.query.where({timestamp: {$lt: currentTimeMillis() - sessionsCleanupTime}});

		await Promise.all([
			this.cleanUpImpl(docs.map(d => d.firebaseToken))
		]);
	};

	cleanUp = async (response: FirebaseType_BatchResponse, messages: FirebaseType_Message[]) => {
		this.logInfo(`${response.successCount} sent, ${response.failureCount} failed`);

		if (response.failureCount > 0)
			this.logWarning(response.responses.filter(r => r.error));

		// const toDelete = response.responses.reduce((carry, resp, i) => {
		// 	if (!resp.success && messages[i])
		// 		carry.push(messages[i].token);
		//
		// 	return carry;
		// }, [] as string[]);

		//TODO: delete notifications for the user that are older than X
		// return this.cleanUpImpl(toDelete); <== THIS WAS THE PROBLEM!!
	};

	private async cleanUpImpl(_toDelete: string[]) {
		if (_toDelete.length === 0)
			return;

		const toDelete = filterDuplicates(_toDelete);
		const _sessions = await batchActionParallel(toDelete, 10, async elements => ModuleBE_PushRegistrationDB.query.where({firebaseToken: {$in: elements}}));
		const sessions = filterDuplicates(_sessions.map(s => s.pushSessionId));
		const async = [
			batchActionParallel(toDelete, 10, async elements => ModuleBE_PushRegistrationDB.query.where({firebaseToken: {$in: elements}})),
			batchActionParallel(sessions, 10, async elements => ModuleBE_PushKeysDB.delete.where({pushSessionId: {$in: elements}}))
		];

		await Promise.all(async);
	}
}

export const ModuleBE_PushPubSub = new ModuleBE_PushPubSub_Class();