/*
 * @nu-art/ts-messaging-backend - ensureForAnchor is 1:1 on knowledge-node (or any) anchor
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {generateHex} from '@nu-art/ts-common';
import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {stormTester} from '@nu-art/storm-testalot';
import {ModuleBE_TopicDB} from '../main/ModuleBE_TopicDB.js';
import {
	asAccount,
	provisionAccounts,
	StormTest_MessagingAcl,
	TEST_MONGO_DB,
} from './utils/helpers.js';

ModuleBE_BaseDB.setDefaultBackend('mongo');
ModuleBE_BaseDB.setMongoDbName(TEST_MONGO_DB);

/** Knowledge-tree Node dbKey — Topic 1:1 on a node uses this pointer, not a /consults path. */
const KnowledgeNode_DbKey = 'nodes';

describe('ts-messaging Topic ensureForAnchor', () => {
	it('second ensure for the same knowledge-node anchor returns the same Topic', async () => {
		await stormTester(StormTest_MessagingAcl, async () => {
			const [creator] = await provisionAccounts(`creator-${generateHex(8)}@test.local`);
			await asAccount(creator, async () => {
				const nodeId = generateHex(32);
				const anchor = {dbKey: KnowledgeNode_DbKey, id: nodeId};
				const first = await ModuleBE_TopicDB.ensureForAnchor(anchor);
				const second = await ModuleBE_TopicDB.ensureForAnchor(anchor);

				expect(first._id).to.equal(second._id);
				expect(first.anchor.dbKey).to.equal(KnowledgeNode_DbKey);
				expect(first.anchor.id).to.equal(nodeId);
				expect(second.anchor.dbKey).to.equal(first.anchor.dbKey);
				expect(second.anchor.id).to.equal(first.anchor.id);
			});
		});
	});

	it('different knowledge-node ids get different Topics', async () => {
		await stormTester(StormTest_MessagingAcl, async () => {
			const [creator] = await provisionAccounts(`creator-${generateHex(8)}@test.local`);
			await asAccount(creator, async () => {
				const first = await ModuleBE_TopicDB.ensureForAnchor({
					dbKey: KnowledgeNode_DbKey,
					id: generateHex(32),
				});
				const other = await ModuleBE_TopicDB.ensureForAnchor({
					dbKey: KnowledgeNode_DbKey,
					id: generateHex(32),
				});
				expect(other._id).to.not.equal(first._id);
			});
		});
	});
});
