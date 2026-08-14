/*
 * @nu-art/ts-messaging-backend - OnMessageMentioned dispatcher after Message create
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {generateHex, Module} from '@nu-art/ts-common';
import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {stormTester} from '@nu-art/storm-testalot';
import type {StormTestInput} from '@nu-art/storm-testalot';
import {ModuleBE_MessageDB} from '../main/ModuleBE_MessageDB.js';
import type {MessageMentionedPayload, OnMessageMentioned} from '../main/dispatchers.js';
import {
	asAccount,
	createTopicForTest,
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

describe('ts-messaging OnMessageMentioned dispatcher', () => {
	it('create with two mention ids dispatches once with both ids', async () => {
		await stormTester(StormTest_MentionDispatcher, async () => {
			MentionSpy.calls = [];
			const [creator, mentionedA, mentionedB] = await provisionAccounts(
				`creator-${generateHex(8)}@test.local`,
				`mentioned-a-${generateHex(8)}@test.local`,
				`mentioned-b-${generateHex(8)}@test.local`,
			);
			const mention = [mentionedA._id, mentionedB._id];

			const {topic, message} = await asAccount(creator, async () => {
				const createdTopic = await createTopicForTest();
				const createdMessage = await asAccount(creator, () => ModuleBE_MessageDB.create.item({
					topicId: createdTopic._id,
					text: 'hello two mentions',
					mention,
				}));
				return {topic: createdTopic, message: createdMessage};
			});

			expect(MentionSpy.calls).to.have.length(1);
			expect(MentionSpy.calls[0].mentionedAccountIds).to.deep.equal(mention);
			expect(MentionSpy.calls[0].message._id).to.equal(message._id);
			expect(MentionSpy.calls[0].topic._id).to.equal(topic._id);
		});
	});

	it('create that omits mention does not dispatch', async () => {
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

	it('create with empty mention does not dispatch', async () => {
		await stormTester(StormTest_MentionDispatcher, async () => {
			MentionSpy.calls = [];
			const [creator] = await provisionAccounts(`creator-${generateHex(8)}@test.local`);

			await asAccount(creator, async () => {
				const topic = await createTopicForTest();
				await asAccount(creator, () => ModuleBE_MessageDB.create.item({
					topicId: topic._id,
					text: 'manual path — no mentions',
					mention: [],
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
					mention: [],
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
