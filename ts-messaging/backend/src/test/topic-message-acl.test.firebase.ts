/*
 * @nu-art/ts-messaging-backend - Per-topic ACL, message:create gate; mention is not an ACL grant
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {generateHex} from '@nu-art/ts-common';
import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {stormTester} from '@nu-art/storm-testalot';
import {ModuleBE_MessageDB} from '../main/ModuleBE_MessageDB.js';
import {ModuleBE_TopicDB} from '../main/ModuleBE_TopicDB.js';
import {
	asAccount,
	createTopicForTest,
	expectForbidden,
	provisionAccounts,
	StormTest_MessagingAcl,
	TEST_MONGO_DB,
} from './utils/helpers.js';

ModuleBE_BaseDB.setDefaultBackend('mongo');
ModuleBE_BaseDB.setMongoDbName(TEST_MONGO_DB);

describe('ts-messaging per-topic ACL', () => {
	it('topic creator can create a Message on that Topic', async () => {
		await stormTester(StormTest_MessagingAcl, async () => {
			const [creator] = await provisionAccounts(`creator-${generateHex(8)}@test.local`);
			await asAccount(creator, async () => {
				const topic = await createTopicForTest();
				await asAccount(creator, async () => {
					const message = await ModuleBE_MessageDB.create.item({
						topicId: topic._id,
						text: 'hello from creator',
					});
					expect(message.topicId).to.equal(topic._id);
					expect(message._auditorId).to.equal(creator._id);
				});
			});
		});
	});

	it('unrelated account cannot create a Message on that Topic', async () => {
		await stormTester(StormTest_MessagingAcl, async () => {
			const [creator, stranger] = await provisionAccounts(
				`creator-${generateHex(8)}@test.local`,
				`stranger-${generateHex(8)}@test.local`,
			);
			const topic = await asAccount(creator, () => createTopicForTest());

			await asAccount(stranger, () => expectForbidden(() => ModuleBE_MessageDB.create.item({
				topicId: topic._id,
				text: 'should be forbidden',
			})));
		});
	});

	it('mention does not grant Message create on that Topic', async () => {
		await stormTester(StormTest_MessagingAcl, async () => {
			const [creator, mentioned] = await provisionAccounts(
				`creator-${generateHex(8)}@test.local`,
				`mentioned-${generateHex(8)}@test.local`,
			);
			const {topic, parent} = await asAccount(creator, async () => {
				const createdTopic = await createTopicForTest();
				const createdParent = await asAccount(creator, () => ModuleBE_MessageDB.create.item({
					topicId: createdTopic._id,
					text: 'hello mentioned',
					mention: [mentioned._id],
				}));
				return {topic: createdTopic, parent: createdParent};
			});

			await asAccount(mentioned, () => expectForbidden(() => ModuleBE_MessageDB.create.item({
				topicId: topic._id,
				text: 'reply after mention',
				parentMessageId: parent._id,
			})));
		});
	});

	it('mentioned account is not a Topic owner — cannot delete Topic or edit someone else\'s Message', async () => {
		await stormTester(StormTest_MessagingAcl, async () => {
			const [creator, mentioned] = await provisionAccounts(
				`creator-${generateHex(8)}@test.local`,
				`mentioned-${generateHex(8)}@test.local`,
			);
			const {topic, message} = await asAccount(creator, async () => {
				const createdTopic = await createTopicForTest();
				const createdMessage = await asAccount(creator, () => ModuleBE_MessageDB.create.item({
					topicId: createdTopic._id,
					text: 'owned by creator',
					mention: [mentioned._id],
				}));
				return {topic: createdTopic, message: createdMessage};
			});

			await asAccount(mentioned, async () => {
				await expectForbidden(() => ModuleBE_TopicDB.delete.unique(topic._id));
				await expectForbidden(() => ModuleBE_MessageDB.set.item({
					...message,
					text: 'mentioned must not edit this',
				}));
			});
		});
	});

	it('author can update own Message; mentioned account cannot', async () => {
		await stormTester(StormTest_MessagingAcl, async () => {
			const [creator, mentioned] = await provisionAccounts(
				`creator-${generateHex(8)}@test.local`,
				`mentioned-${generateHex(8)}@test.local`,
			);
			const updated = await asAccount(creator, async () => {
				const topic = await createTopicForTest();
				const message = await asAccount(creator, () => ModuleBE_MessageDB.create.item({
					topicId: topic._id,
					text: 'original',
					mention: [mentioned._id],
				}));
				const edited = await ModuleBE_MessageDB.set.item({
					...message,
					text: 'edited by author',
				});
				expect(edited.text).to.equal('edited by author');
				return edited;
			});

			await asAccount(mentioned, () => expectForbidden(() => ModuleBE_MessageDB.set.item({
				...updated,
				text: 'mentioned must not edit author message',
			})));
		});
	});
});
