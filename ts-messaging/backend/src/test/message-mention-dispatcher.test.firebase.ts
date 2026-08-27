/*
 * @nu-art/ts-messaging-backend - mention resolve + OnMessageMentioned
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {generateHex, Module} from '@nu-art/ts-common';
import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {stormTester} from '@nu-art/storm-testalot';
import type {StormTestInput} from '@nu-art/storm-testalot';
import {formatMessageMentionToken} from '@nu-art/ts-messaging-shared';
import {ModuleBE_MessageDB} from '../main/ModuleBE_MessageDB.js';
import {ModuleBE_MessagingAccess} from '../main/messaging-access-wiring.js';
import type {MessageMentionedPayload, OnMessageMentioned} from '../main/dispatchers.js';
import {
	asAccount,
	createTopicForTest,
	expectBadRequest,
	provisionAccounts,
	StormTest_MessagingAcl,
	TEST_MONGO_DB,
} from './utils/helpers.js';

class MentionSpy_Class
	extends Module
	implements OnMessageMentioned {

	public calls: MessageMentionedPayload[] = [];

	public __onMessageMentioned(payload: MessageMentionedPayload) {
		this.calls.push(payload);
	}
}

const MentionSpy = new MentionSpy_Class();

const StormTest_MentionDispatcher: StormTestInput = {
	...StormTest_MessagingAcl,
	modules: [...StormTest_MessagingAcl.modules, MentionSpy],
};

ModuleBE_BaseDB.setDefaultBackend('mongo');
ModuleBE_BaseDB.setMongoDbName(TEST_MONGO_DB);

describe('ts-messaging mention resolve + dispatcher', () => {
	it('1:1 infers the other writer and dispatches — client mention[] is ignored', async () => {
		await stormTester(StormTest_MentionDispatcher, async () => {
			MentionSpy.calls = [];
			const [creator, other, stranger] = await provisionAccounts(
				`creator-${generateHex(8)}@test.local`,
				`other-${generateHex(8)}@test.local`,
				`stranger-${generateHex(8)}@test.local`,
			);

			const {topic, message} = await asAccount(creator, async () => {
				const createdTopic = await createTopicForTest();
				await ModuleBE_MessagingAccess.addAccountToTopic(createdTopic._id, other._id);
				const createdMessage = await asAccount(creator, () => ModuleBE_MessageDB.create.item({
					topicId: createdTopic._id,
					text: 'plain 1:1 — no token',
					mention: [stranger._id],
				}));
				return {topic: createdTopic, message: createdMessage};
			});

			expect(message.mention).to.deep.equal([other._id]);
			expect(MentionSpy.calls).to.have.length(1);
			expect(MentionSpy.calls[0].mentionedAccountIds).to.deep.equal([other._id]);
			expect(MentionSpy.calls[0].message._id).to.equal(message._id);
			expect(MentionSpy.calls[0].topic._id).to.equal(topic._id);
		});
	});

	it('multi-party without @_id does not infer or dispatch', async () => {
		await stormTester(StormTest_MentionDispatcher, async () => {
			MentionSpy.calls = [];
			const [creator, a, b] = await provisionAccounts(
				`creator-${generateHex(8)}@test.local`,
				`a-${generateHex(8)}@test.local`,
				`b-${generateHex(8)}@test.local`,
			);

			const message = await asAccount(creator, async () => {
				const topic = await createTopicForTest();
				await ModuleBE_MessagingAccess.addAccountToTopic(topic._id, a._id);
				await ModuleBE_MessagingAccess.addAccountToTopic(topic._id, b._id);
				return asAccount(creator, () => ModuleBE_MessageDB.create.item({
					topicId: topic._id,
					text: 'hey room',
					mention: [a._id, b._id],
				}));
			});

			expect(message.mention ?? []).to.deep.equal([]);
			expect(MentionSpy.calls).to.have.length(0);
		});
	});

	it('multi-party @_id of a writer dispatches that account', async () => {
		await stormTester(StormTest_MentionDispatcher, async () => {
			MentionSpy.calls = [];
			const [creator, writer, peer] = await provisionAccounts(
				`creator-${generateHex(8)}@test.local`,
				`writer-${generateHex(8)}@test.local`,
				`peer-${generateHex(8)}@test.local`,
			);

			const message = await asAccount(creator, async () => {
				const topic = await createTopicForTest();
				await ModuleBE_MessagingAccess.addAccountToTopic(topic._id, writer._id);
				await ModuleBE_MessagingAccess.addAccountToTopic(topic._id, peer._id);
				return asAccount(creator, () => ModuleBE_MessageDB.create.item({
					topicId: topic._id,
					text: `ask ${formatMessageMentionToken(writer._id)}`,
				}));
			});

			expect(message.mention).to.deep.equal([writer._id]);
			expect(MentionSpy.calls).to.have.length(1);
			expect(MentionSpy.calls[0].mentionedAccountIds).to.deep.equal([writer._id]);
		});
	});

	it('@_id of a missing or non-writer account rejects the create', async () => {
		await stormTester(StormTest_MentionDispatcher, async () => {
			MentionSpy.calls = [];
			const [creator, writer, peer, outsider] = await provisionAccounts(
				`creator-${generateHex(8)}@test.local`,
				`writer-${generateHex(8)}@test.local`,
				`peer-${generateHex(8)}@test.local`,
				`outsider-${generateHex(8)}@test.local`,
			);
			const missingId = generateHex(32);

			await asAccount(creator, async () => {
				const topic = await createTopicForTest();
				await ModuleBE_MessagingAccess.addAccountToTopic(topic._id, writer._id);
				await ModuleBE_MessagingAccess.addAccountToTopic(topic._id, peer._id);
				await expectBadRequest(() => asAccount(creator, () => ModuleBE_MessageDB.create.item({
					topicId: topic._id,
					text: `ask ${formatMessageMentionToken(writer._id)} and ${formatMessageMentionToken(outsider._id)}`,
				})));
				await expectBadRequest(() => asAccount(creator, () => ModuleBE_MessageDB.create.item({
					topicId: topic._id,
					text: `ask ${formatMessageMentionToken(missingId)}`,
				})));
			});

			expect(MentionSpy.calls).to.have.length(0);
		});
	});

	it('solo topic without @_id does not dispatch', async () => {
		await stormTester(StormTest_MentionDispatcher, async () => {
			MentionSpy.calls = [];
			const [creator] = await provisionAccounts(`creator-${generateHex(8)}@test.local`);

			await asAccount(creator, async () => {
				const topic = await createTopicForTest();
				await asAccount(creator, () => ModuleBE_MessageDB.create.item({
					topicId: topic._id,
					text: 'manual path — mention omitted',
				}));
			});

			expect(MentionSpy.calls).to.have.length(0);
		});
	});

	it('update does not dispatch', async () => {
		await stormTester(StormTest_MentionDispatcher, async () => {
			MentionSpy.calls = [];
			const [creator] = await provisionAccounts(`creator-${generateHex(8)}@test.local`);

			await asAccount(creator, async () => {
				const topic = await createTopicForTest();
				const message = await asAccount(creator, () => ModuleBE_MessageDB.create.item({
					topicId: topic._id,
					text: 'original',
				}));
				MentionSpy.calls = [];
				await ModuleBE_MessageDB.set.item({
					...message,
					text: 'edited by author',
				});
			});

			expect(MentionSpy.calls).to.have.length(0);
		});
	});
});
