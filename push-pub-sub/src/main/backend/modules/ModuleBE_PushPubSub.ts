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

import {arrayToMap, batchActionParallel, compare, currentTimeMillis, Day, filterDuplicates, filterKeys, KB, LogLevel, Module} from '@nu-art/ts-common';

import {FirebaseType_BatchResponse, FirebaseType_Message, ModuleBE_Firebase, PushMessagesWrapperBE} from '@nu-art/firebase/backend';
import {ApiDef_PushMessages, DB_PushSubscription, PushMessage, PushMessage_Payload, PushMessage_PayloadWrapper, Request_PushRegister} from '../../index';

import {addRoutes, createBodyServerApi, OnCleanupSchedulerAct} from '@nu-art/thunderstorm/backend';

import {MemKey_AccountId} from '@nu-art/user-account/backend';
import {firestore} from 'firebase-admin';
import {UI_PushSession} from '../../shared/push-session';
import {ModuleBE_PushSessionDB} from './ModuleBE_PushSessionDB';
import {ModuleBE_PushSubscriptionDB} from './ModuleBE_PushSubscriptionDB';
import {DBProto_PushMessagesHistory} from '../../shared/push-messages-history';
import {ModuleBE_PushMessagesHistoryDB} from './ModuleBE_PushMessagesHistoryDB';
import Transaction = firestore.Transaction;
import {HttpCodes} from '@nu-art/ts-common/core/exceptions/http-codes';


type Config = {
	messageLengthLimit: number
	notificationsCleanupTime?: number
	sessionsCleanupTime?: number
};

export class ModuleBE_PushPubSub_Class
	extends Module<Config>
	implements OnCleanupSchedulerAct {

	// private pushSessions!: FirestoreCollection<DB_PushSession>;
	// private topics!: FirestoreCollection<DB_PushSubscription>;
	private messaging!: PushMessagesWrapperBE;

	constructor() {
		super();
		this.setMinLevel(LogLevel.Verbose);
		this.setDefaultConfig({messageLengthLimit: 10 * KB});
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
		const session: UI_PushSession = {
			firebaseToken: body.firebaseToken,
			pushSessionId: body.pushSessionId,
			timestamp: currentTimeMillis(),
			accountId
		};

		await ModuleBE_PushSessionDB.set.item(session);

		const subscriptions: DB_PushSubscription[] = body.subscriptions.map((subscription): DB_PushSubscription => {
			return filterKeys({
				pushSessionId: body.pushSessionId,
				...subscription
			});
		});

		await ModuleBE_PushSubscriptionDB.runTransaction(async transaction => {
			const data = await ModuleBE_PushSubscriptionDB.query.where({pushSessionId: body.pushSessionId}, transaction);
			const toInsert = subscriptions.filter(s => !data.find(d => d.topic === s.topic && compare(s.filter, d.filter)));
			if (toInsert.length === 0)
				return;

			this.logWarning(`Subscribe on: `, toInsert);
			return ModuleBE_PushSubscriptionDB.create.all(toInsert, transaction);
		});
	};

// ---------------------------

	pushToKey = async <MessageType extends PushMessage<any, any, any>>(message: MessageType) => {
		const originatingAccountId = MemKey_AccountId.get();
		const messageLength = JSON.stringify(message).length;
		if (messageLength > this.config.messageLengthLimit)
			throw HttpCodes._4XX.BAD_REQUEST(`Message content too long, ${messageLength} > ${this.config.messageLengthLimit}`,);

		const messageSubscription = {topic: message.topic, props: message.filter};
		return ModuleBE_PushSubscriptionDB.runTransaction(async (transaction: Transaction) => {
			let subscriptions = await ModuleBE_PushSubscriptionDB.query.where({topic: message.topic}, transaction);
			this.logVerbose(`Found ${subscriptions.length} subscribers for message: `, messageSubscription);
			if (message.filter)
				subscriptions = subscriptions.filter(subscription => !subscription.filter || compare(subscription.filter, message.filter));

			if (subscriptions.length === 0)
				return this.logDebug('No subscribers match message: ', message);

			const sessionsIds = subscriptions.map(d => d.pushSessionId);
			// I get the tokens relative to those sessions (query)
			this.logDebug(`Sending push to:`, ` -- Sessions:`, sessionsIds, ` -- Message: `, message);

			const pushSessions = await batchActionParallel(sessionsIds, 10, async elements => ModuleBE_PushSessionDB.query.where({pushSessionId: {$in: elements}}, transaction));
			const map_sessionIdToSession = arrayToMap(pushSessions, session => session.pushSessionId);

			subscriptions = subscriptions.filter(subscription => map_sessionIdToSession[subscription.pushSessionId]);

			const messagesToCreate: DBProto_PushMessagesHistory['preDbType'][] = subscriptions.map((subscription: DB_PushSubscription) => {
				return {
					pushSessionId: subscription.pushSessionId,
					token: map_sessionIdToSession[subscription.pushSessionId].firebaseToken,
					message: message,
					read: false,
					originatingAccountId
				};
			});

			if (messagesToCreate.length === 0)
				return this.logDebug('No subscribers match message: ', message);

			const dbMessages = await ModuleBE_PushMessagesHistoryDB.create.all(messagesToCreate);
			const messagesToSend: FirebaseType_Message[] = dbMessages.map(dbMessage => {
				const messageBody: PushMessage_Payload = {
					_id: dbMessage._id,
					timestamp: dbMessage.__created,
					message: dbMessage.message,
					topic: message.topic,
					filter: message.filter,
				};

				const data: PushMessage_PayloadWrapper = {
					sessionId: dbMessage.pushSessionId,
					payload: JSON.stringify(messageBody)
				};

				return {
					token: dbMessage.token,
					data: data
				};
			});

			const {response, messages} = await this.sendMessage(messagesToSend);
			this.logInfo(`${response.successCount} sent, ${response.failureCount} failed`, 'messages', messages);
			// return this.cleanUp(response, messages);
		});
	};

	// async pushToUser<MessageType extends PushMessage<any, any, any>>(accountId: string, message: MessageType) {
	// 	const notification = this.buildNotification(message);
	// 	this.logInfo(`Account ${notification.originatingAccountId} is pushing to user ${accountId}`, message.filter);
	//
	// 	const docs = await ModuleBE_PushSessionDB.query.where({accountId});
	// 	if (docs.length === 0)
	// 		return;
	//
	// 	const sessionsIds = docs.map(d => d.pushSessionId);
	// 	const sessions = await batchActionParallel(sessionsIds, 10, async elements =>
	// 		ModuleBE_PushSessionDB.query.where({pushSessionId: {$in: elements}}));
	//
	// 	const _messages = docs.reduce((carry: TempMessages, db_topic) => {
	// 		const session = sessions.find(s => s.pushSessionId === db_topic.pushSessionId);
	// 		if (!session)
	// 			return carry;
	//
	// 		carry[session.firebaseToken] = [notification];
	//
	// 		return carry;
	// 	}, {} as TempMessages);
	//
	// 	await this.sendMessage(_messages);
	// }

	// private buildNotification<MessageType extends PushMessage<any, any, any>>(message: MessageType) {
	// 	const originatingAccountId = MemKey_AccountId.get();
	//
	// 	return {
	// 		message: JSON.stringify(message),
	// 		read: false,
	// 		originatingAccountId
	// 	};
	// }

	sendMessage = async (messages: FirebaseType_Message[]): Promise<{ response: FirebaseType_BatchResponse, messages: FirebaseType_Message[] }> => {
		this.logInfo('sending a message to \n' + Object.keys(messages).join('\n'));
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
		const docs = await ModuleBE_PushSessionDB.query.where({timestamp: {$lt: currentTimeMillis() - sessionsCleanupTime}});

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
		const _sessions = await batchActionParallel(toDelete, 10, async elements => ModuleBE_PushSessionDB.query.where({firebaseToken: {$in: elements}}));
		const sessions = filterDuplicates(_sessions.map(s => s.pushSessionId));
		const async = [
			batchActionParallel(toDelete, 10, async elements => ModuleBE_PushSessionDB.query.where({firebaseToken: {$in: elements}})),
			batchActionParallel(sessions, 10, async elements => ModuleBE_PushSubscriptionDB.delete.where({pushSessionId: {$in: elements}}))
		];

		await Promise.all(async);
	}
}

export const ModuleBE_PushPubSub = new ModuleBE_PushPubSub_Class();