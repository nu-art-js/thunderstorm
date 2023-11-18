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

import {__custom, __scenario} from '@nu-art/testelot';
import {ModuleBE_PushPubSub} from '../main/backend/modules/ModuleBE_PushPubSub';
import {assert, compare, currentTimeMillis, generateHex, Hour} from '@nu-art/ts-common';
import {DB_PushSubscription, DB_PushSession, Request_PushRegister} from '../main';
import {FirestoreCollection, FirestoreTransaction} from '@nu-art/firebase/backend';


const arrayOf2 = Array(2).fill(0);
export const scenarioCleanup = __scenario('Scheduled Cleaup');

const testRegister = async function (request: Request_PushRegister, timestamp: number) {
	const session: DB_PushSession = {
		pushSessionId: 'abc',
		firebaseToken: request.firebaseToken,
		timestamp,
		userId: 'fake-user'
	};

	// @ts-ignore
	await ModuleBE_PushPubSub.pushSessions.upsert(session);

	const subscriptions = request.subscriptions.map((s): DB_PushSubscription => ({
		pushSessionId: request.pushSessionId,
		topic: s.topic,
		props: s.props
	}));

	// @ts-ignore
	const topicsCollection: FirestoreCollection<DB_PushSubscription> = ModuleBE_PushPubSub.topics;

	return topicsCollection.runInTransaction(async (transaction: FirestoreTransaction) => {
		const data = await transaction.query(topicsCollection, {where: {pushSessionId: request.pushSessionId}});
		const toInsert = subscriptions.filter(s => !data.find((d: DB_PushSubscription) => compare(d, s)));
		return Promise.all(toInsert.map(instance => transaction.insert(topicsCollection, instance)));
	});
};

const processClean = __custom(async () => {
	// @ts-ignore
	const asyncs = [ModuleBE_PushPubSub.topics.deleteAll(), ModuleBE_PushPubSub.pushSessions.deleteAll()];
	return Promise.all(asyncs);
}).setLabel('Start Clean');

const populate = (timestamp: number) => __custom(async () => {
	for (const i in arrayOf2) {
		const instance = {
			pushSessionId: generateHex(8),
			firebaseToken: generateHex(8),
			subscriptions: arrayOf2.map((_e, _i) => ({topic: generateHex(8), props: {a: _i}}))
		};
		await testRegister(instance, timestamp);
	}
}).setLabel('Populate');

const cleaup = __custom(async () => ModuleBE_PushPubSub.scheduledCleanup()).setLabel('Cleaning up');

const check = __custom(async () => {
	// @ts-ignore
	const docs = await ModuleBE_PushPubSub.pushSessions.query({where: {timestamp: {$lt: currentTimeMillis() - Hour}}});
	assert(`There shouldn't be any docs`, docs.length, 0);
}).setLabel('Checking clean');

scenarioCleanup.add(processClean);
scenarioCleanup.add(populate(currentTimeMillis() - 2 * Hour));
scenarioCleanup.add(populate(currentTimeMillis() + 2 * Hour));
scenarioCleanup.add(cleaup);
scenarioCleanup.add(check);