/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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

import {
	__stringify,
	batchAction,
	compare,
	currentTimeMillies,
	Day,
	filterDuplicates,
	generateHex,
	Hour,
	ImplementationMissingException,
	Module,
	Subset
} from "@nu-art/ts-common";

import {
	FirebaseModule,
	FirebaseType_BatchResponse,
	FirebaseType_Message,
	FirestoreCollection,
	FirestoreTransaction,
	PushMessagesWrapper
} from "@nu-art/firebase/backend";
// noinspection TypeScriptPreferShortImport
import {
	DB_Notifications,
	DB_PushKeys,
	DB_PushSession,
	IFP,
	ISP,
	ITP,
	MessageType,
	Request_PushRegister,
	SubscribeProps
} from "../../index";
import {
	dispatch_queryRequestInfo,
	ExpressRequest
} from "@nu-art/thunderstorm/backend";

type Config = {
	notificationsCleanupTime?: number
	sessionsCleanupTime?: number
};

type TempMessages = {
	[token: string]: DB_Notifications[]
};

export class PushPubSubModule_Class
	extends Module<Config> {

	private pushSessions!: FirestoreCollection<DB_PushSession>;
	private pushKeys!: FirestoreCollection<DB_PushKeys>;
	private notifications!: FirestoreCollection<DB_Notifications>;
	private messaging!: PushMessagesWrapper;

	protected init(): void {
		const session = FirebaseModule.createAdminSession();
		const firestore = session.getFirestore();

		this.pushSessions = firestore.getCollection<DB_PushSession>("push-sessions", ["pushSessionId"]);
		this.pushKeys = firestore.getCollection<DB_PushKeys>("push-keys");
		this.notifications = firestore.getCollection<DB_Notifications>("notifications", ["_id"]);
		this.messaging = session.getMessaging();
	}

	async register(body: Request_PushRegister, request: ExpressRequest): Promise<DB_Notifications[]> {
		const resp = await dispatch_queryRequestInfo.dispatchModuleAsync([request]);
		const userId: string | undefined = resp.find(e => e.key === "AccountsModule")?.data?._id || resp.find(e => e.key === "RemoteProxy")?.data;
		if (!userId)
			throw new ImplementationMissingException("Missing user from accounts Module");

		const session: DB_PushSession = {
			firebaseToken: body.firebaseToken,
			pushSessionId: body.pushSessionId,
			timestamp: currentTimeMillies(),
			userId
		};

		const subscriptions: DB_PushKeys[] = body.subscriptions.map((s): DB_PushKeys => {
			const sub: DB_PushKeys = {
				pushSessionId: body.pushSessionId,
				pushKey: s.pushKey
			};
			if (s.props)
				sub.props = s.props;

			return sub;
		});

		return this.pushSessions.runInTransaction(async transaction => {
			const pushKeys = subscriptions.map(_sub => _sub.pushKey);

			let subscriptionNotifications: DB_Notifications[] = pushKeys.length !== 0 ?
				await batchAction(pushKeys, 10, async elements => transaction.query(this.notifications, {where: {pushKey: {$in: elements}}})) : [];

			if (subscriptionNotifications.length > 0)
				subscriptionNotifications = subscriptionNotifications.filter(_notification => {
					const x = subscriptions.find(_sub => _sub.pushKey === _notification.pushKey)?.props;
					return compare(x, _notification.props) || _notification.userId;
				});

			const userNotifications: DB_Notifications[] = await transaction.query(this.notifications, {where: {userId}});
			const notifications = userNotifications.concat(subscriptionNotifications);
			const writePush = await transaction.upsert_Read(this.pushSessions, session);

			const write = await transaction.delete_Read(this.pushKeys, {where: {pushSessionId: body.pushSessionId}});
			await transaction.insertAll(this.pushKeys, subscriptions);
			await Promise.all([write(), writePush()]);
			return filterDuplicates(notifications);
		});
	}

	async pushToKey<M extends MessageType<any, any, any> = never,
		S extends string = IFP<M>,
		P extends SubscribeProps = ISP<M>,
		D = ITP<M>>(key: S, props?: P, data?: D, persistent: boolean = false, transaction?: FirestoreTransaction) {
		const processor = async (_transaction: FirestoreTransaction) => {
			console.log("i am pushing to key...", key, props, data);
			let docs = await _transaction.query(this.pushKeys, {where: {pushKey: key}});
			if (props)
				docs = docs.filter(doc => !doc.props || compare(doc.props, props));

			const notification = this.buildNotification(key, persistent, data, props);
			// If we need to do read and write for a transaction move this to a callback and rename to pushToKey_Read
			if (persistent) {
				await this.notifications.insertAll([notification]);
			}

			if (docs.length === 0)
				return;

			const sessionsIds = docs.map(d => d.pushSessionId);
			// I get the tokens relative to those sessions (query)
			const sessions = await batchAction(sessionsIds, 10, async elements => _transaction.query(this.pushSessions, {where: {pushSessionId: {$in: elements}}}));
			const _messages = docs.reduce((carry: TempMessages, db_pushKey: DB_PushKeys) => {
				const session = sessions.find(s => s.pushSessionId === db_pushKey.pushSessionId);
				if (!session)
					return carry;

				carry[session.firebaseToken] = [notification];

				return carry;
			}, {} as TempMessages);
			const resp = await this.sendMessage(persistent, _messages);
			if (!resp)
				return this.logInfo('No messages to send. Empty subscriptions');

			const {response, messages} = resp;
			this.logInfo(`${response.successCount} sent, ${response.failureCount} failed`, "messages", messages);
			// return this.cleanUp(response, messages);
		};
		if (transaction)
			return processor(transaction);

		return this.pushKeys.runInTransaction(processor);
	}

	async pushToUser<M extends MessageType<any, any, any> = never,
		S extends string = IFP<M>,
		P extends SubscribeProps = ISP<M>,
		D = ITP<M>>(user: string, key: string, props?: P, data?: D, persistent: boolean = false) {
		console.log("i am pushing to user...", user, props);

		const notification = this.buildNotification(key, persistent, data, props, user);
		const notifications: DB_Notifications[] = [];
		if (persistent) {
			notifications.push(notification);
			await this.notifications.insertAll(notifications);
		}

		const docs = await this.pushSessions.query({where: {userId: user}});
		if (docs.length === 0)
			return;

		const sessionsIds = docs.map(d => d.pushSessionId);
		const sessions = await batchAction(sessionsIds, 10, async elements => this.pushSessions.query({where: {pushSessionId: {$in: elements}}}));

		const _messages = docs.reduce((carry: TempMessages, db_pushKey: DB_PushSession) => {
			const session = sessions.find(s => s.pushSessionId === db_pushKey.pushSessionId);
			if (!session)
				return carry;

			carry[session.firebaseToken] = [notification];


			return carry;
		}, {} as TempMessages);

		await this.sendMessage(persistent, _messages);
	}

	private buildNotification = (pushkey: string, persistent: boolean, data?: any, props?: any, user?: string) => {
		const notification: DB_Notifications = {
			_id: generateHex(16),
			timestamp: currentTimeMillies(),
			read: false,
			pushKey: pushkey,
			persistent
		};

		if (data)
			notification.data = data;

		if (props)
			notification.props = props;

		if (user)
			notification.userId = user;

		return notification;
	};

	sendMessage = async (persistent: boolean, _messages: TempMessages): Promise<{ response: FirebaseType_BatchResponse, messages: FirebaseType_Message[] } | undefined> => {
		const messages: FirebaseType_Message[] = Object.keys(_messages).map(token => ({token, data: {messages: __stringify(_messages[token])}}));
		if (messages.length === 0)
			return;

		console.log("sending a message to \n" + Object.keys(_messages).join("\n"));
		const response: FirebaseType_BatchResponse = await this.messaging.sendAll(messages);
		console.log("and this is the response: " + response.responses.map(_response => _response.success));
		return {response, messages};
	};

	readNotification = async (id: string, read: boolean) => {
		await this.notifications.patch({_id: id, read} as Subset<DB_Notifications>);
	};

	scheduledCleanup = async () => {
		const sessionsCleanupTime = this.config?.sessionsCleanupTime || Hour;
		const notificationsCleanupTime = this.config?.notificationsCleanupTime || 7 * Day;

		const docs = await this.pushSessions.query({where: {timestamp: {$lt: currentTimeMillies() - sessionsCleanupTime}}});

		await Promise.all([
			                  this.notifications.delete({where: {timestamp: {$lt: currentTimeMillies() - notificationsCleanupTime}}}),
			                  this.cleanUpImpl(docs.map(d => d.firebaseToken))
		                  ]);
	};

	cleanUp = async (response: FirebaseType_BatchResponse, messages: FirebaseType_Message[]) => {
		this.logInfo(`${response.successCount} sent, ${response.failureCount} failed`);

		if (response.failureCount > 0)
			this.logWarning(response.responses.filter(r => r.error));

		const toDelete = response.responses.reduce((carry, resp, i) => {
			if (!resp.success && messages[i])
				carry.push(messages[i].token);

			return carry;
		}, [] as string[]);

		//TODO: delete notifications for the user that are older than X
		return this.cleanUpImpl(toDelete);
	};

	private async cleanUpImpl(toDelete: string[]) {
		if (toDelete.length === 0)
			return;

		const sessions = await this.pushSessions.query({where: {firebaseToken: {$in: toDelete}}});
		const async = [
			batchAction(toDelete, 10, async elements => this.pushSessions.delete({where: {firebaseToken: {$in: elements}}})),
			batchAction(sessions.map(s => s.pushSessionId), 10, async elements => this.pushKeys.delete({where: {pushSessionId: {$in: elements}}}))
		];

		await Promise.all(async);
	}
}

export const PushPubSubModule = new PushPubSubModule_Class();