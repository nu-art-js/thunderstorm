import {
	__stringify,
	compare,
	currentTimeMillies,
	Module
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
	SubscribeProps
} from "../..";

type Config = {};

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
		// theoretically I should also check if the firebaseToken is already present
		// and delete prev sessions with relative pushKeys...later
		const subscriptions = request.subscriptions.map((s): DB_PushKeys => ({
			firebaseToken: request.firebaseToken,
			key: s.pushKey,
			props: s.props
		}));

		await this.pushKeys.runInTransaction(async transaction => {
			const data = await transaction.query(this.pushKeys, {where: {firebaseToken: request.firebaseToken}});
			const toInsert = subscriptions.filter(s => !data.find(d => d.key === s.key && compare(s.props, d.props)))
			return Promise.all(toInsert.map(instance => transaction.insert(this.pushKeys, instance)));
		})
	}

	async pushToKey(key: string, props: SubscribeProps) {
		const docs = await this.pushKeys.query({where: {key}});

		const messages = docs.reduce((carry: FirebaseType_Message[], pushKey: DB_PushKeys) => {
			const message = carry.find(m => m.token === pushKey.firebaseToken);
			if (!message) {
				carry.push({data: {[pushKey.key]: __stringify(pushKey.props)}, token: pushKey.firebaseToken})
				return carry;
			}

			message.data = message.data || {};
			message.data[pushKey.key] = __stringify(pushKey.props);
			return carry;
		}, [] as FirebaseType_Message[])

		if(messages.length === 0)
			return;

		const res: FirebaseType_BatchResponse = await this.messaging.sendAll(messages)
		return this.cleanUp(res, messages)
	}

	private cleanUp = async (response: FirebaseType_BatchResponse, messages: FirebaseType_Message[]) => {
		const toDelete = response.responses.reduce((carry, resp, i) => {
			if (!resp.success) {
				const message = messages[i];
				message && carry.push(message.token);
			}

			return carry
		}, [] as string[]);

		if (toDelete.length === 0)
			return

		const async = [
			this.pushSessions.delete({where: {firebaseToken: {$in: toDelete}}}),
			this.pushKeys.delete({where: {firebaseToken: {$in: toDelete}}})
		];

		await Promise.all(async)
	};
}

export const PushPubSubModule = new PushPubSubModule_Class();