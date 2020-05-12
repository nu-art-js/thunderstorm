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
	compare,
	currentTimeMillies,
	Module,
    Hour
} from "@nu-art/ts-common";

import {
	FirebaseModule,
	FirebaseType_BatchResponse,
	FirebaseType_Message,
	FirestoreCollection,
	PushMessagesWrapper
} from '@nu-art/firebase/backend';
import {
	DB_PushKeys,
	DB_PushSession,
	Request_PushRegister,
	SubscribeProps,
	SubscriptionData
} from "../..";

type Config = {
	delta_time?: number
};

type TempMessages = {
	[token: string]: SubscriptionData[]
};

export class PushPubSubModule_Class
	extends Module<Config> {

	private pushSessions!: FirestoreCollection<DB_PushSession>;
	private pushKeys!: FirestoreCollection<DB_PushKeys>;
	private messaging!: PushMessagesWrapper;

	protected init(): void {
		const session = FirebaseModule.createAdminSession();
		const firestore = session.getFirestore();

		this.pushSessions = firestore.getCollection<DB_PushSession>('push-sessions', ["firebaseToken"]);
		this.pushKeys = firestore.getCollection<DB_PushKeys>('push-keys');

		this.messaging = session.getMessaging();
	}

	async register(request: Request_PushRegister) {
		const session: DB_PushSession = {
			firebaseToken: request.firebaseToken,
			timestamp: currentTimeMillies()
		};
		await this.pushSessions.upsert(session);

		const subscriptions = request.subscriptions.map((s): DB_PushKeys => ({
			firebaseToken: request.firebaseToken,
			pushKey: s.pushKey,
			props: s.props
		}));

		return this.pushKeys.runInTransaction(async transaction => {
			const data = await transaction.query(this.pushKeys, {where: {firebaseToken: request.firebaseToken}});
			const toInsert = subscriptions.filter(s => !data.find(d => compare(d,s)));
			return Promise.all(toInsert.map(instance => transaction.insert(this.pushKeys, instance)));
		})
	}

	async pushToKey(key: string, props?: SubscribeProps, data?: any) {
		let docs = await this.pushKeys.query({where: {pushKey: key}});
		if (props)
			docs = docs.filter(doc => compare(doc.props, props));

		if (docs.length === 0)
			return;

		const _messages = docs.reduce((carry: TempMessages, db_pushKey: DB_PushKeys) => {
			carry[db_pushKey.firebaseToken] = carry[db_pushKey.firebaseToken] || [];

			const item = {
				pushKey: db_pushKey.pushKey,
				props: db_pushKey.props,
				data
			};
			carry[db_pushKey.firebaseToken].push(item)

			return carry
		}, {} as TempMessages);

		const messages = Object.keys(_messages).map(token => ({token, data: {messages: __stringify(_messages[token])}}))
		const res: FirebaseType_BatchResponse = await this.messaging.sendAll(messages);

		return this.cleanUp(res, messages)
	}

	scheduledCleanup = async () => {
		const delta_time = this.config?.delta_time || Hour;
		// @ts-ignore
		const docRefs = await this.pushSessions._query({where: {timestamp: {$lt: currentTimeMillies() - delta_time}}});
		// @ts-ignore
		const vals: DB_PushSession[] = docRefs.map(d => d.data());
		// @ts-ignore
		const asyncs: Promise<any>[] = [this.pushSessions.deleteBatch(docRefs)]

		vals.forEach(v => asyncs.push(this.pushKeys.delete({where: {firebaseToken: v.firebaseToken}})));
		await Promise.all(asyncs)
	};

	private cleanUp = async (response: FirebaseType_BatchResponse, messages: FirebaseType_Message[]) => {
		const toDelete = response.responses.reduce((carry, resp, i) => {
			if (!resp.success) {
				const message = messages[i];
				message && carry.push(message.token);
			}

			return carry
		}, [] as string[]);

		if (toDelete.length === 0)
			return;

		const async = [
			this.pushSessions.delete({where: {firebaseToken: {$in: toDelete}}}),
			this.pushKeys.delete({where: {firebaseToken: {$in: toDelete}}})
		];

		await Promise.all(async)
	};
}

export const PushPubSubModule = new PushPubSubModule_Class();