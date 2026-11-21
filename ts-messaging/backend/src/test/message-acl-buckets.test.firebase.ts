/*
 * @nu-art/ts-messaging-backend - Message bucket ACL. One case per actor and action.
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {generateHex} from '@nu-art/ts-common';
import {stringToUniqueId} from '@nu-art/db-api-shared';
import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {stormTester} from '@nu-art/storm-testalot';
import {deriveEntityGroupId} from '@nu-art/permissions-backend';
import type {DatabaseDef_AccessGroup, DocumentAccessInner} from '@nu-art/permissions-shared';
import type {DB_Account} from '@nu-art/user-account-shared';
import {MessagingAdminGroupId} from '@nu-art/ts-messaging-shared';
import {ModuleBE_MessageDB} from '../main/ModuleBE_MessageDB.js';
import {
	addAccountToGroup,
	asAccount,
	createTopicForTest,
	expectForbidden,
	grantTopicBucket,
	provisionAccounts,
	StormTest_MessagingAcl,
	TEST_MONGO_DB,
} from './utils/helpers.js';

ModuleBE_BaseDB.setMongoDbName(TEST_MONGO_DB);

type ActorName = 'author' | 'reader' | 'owner' | 'deleter' | 'poster' | 'admin' | 'stranger';

const readAllowed: Record<ActorName, boolean> = {
	author: true,
	reader: true,
	owner: true,
	deleter: true,
	poster: true,
	admin: false,
	stranger: false,
};

const editAllowed: Record<ActorName, boolean> = {
	author: true,
	reader: false,
	owner: false,
	deleter: false,
	poster: false,
	admin: false,
	stranger: false,
};

const deleteAllowed: Record<ActorName, boolean> = {
	author: true,
	reader: false,
	owner: false,
	deleter: true,
	poster: false,
	admin: true,
	stranger: false,
};

const createAllowed: Record<ActorName, boolean> = {
	author: true,
	reader: false,
	owner: true,
	deleter: false,
	poster: true,
	admin: false,
	stranger: false,
};

function email(role: string): string {
	return `${role}-${generateHex(8)}@test.local`;
}

describe('message ACL buckets', () => {
	it('stores read, write, delete, and owner as separate lists', async () => {
		await stormTester(StormTest_MessagingAcl, async () => {
			const [author] = await provisionAccounts(email('author'));
			const topic = await asAccount(author, () => createTopicForTest());
			const message = await asAccount(author, () => ModuleBE_MessageDB.create.item({
				topicId: topic._id,
				text: 'original',
			}));
			const stored = await asAccount(author, () => ModuleBE_MessageDB.query.uniqueUnmanipulated(message._id));
			const access = (stored as {__access?: DocumentAccessInner} | undefined)?.__access;
			if (!access)
				expect.fail('message access');
			const authorGroupId = stringToUniqueId<DatabaseDef_AccessGroup['dbKey']>(author._id);

			expect(access.readers).to.include(deriveEntityGroupId(topic._id, 'readers'));
			expect(access.writers).to.deep.equal([authorGroupId]);
			expect(access.owners).to.deep.equal([deriveEntityGroupId(topic._id, 'owners')]);
			expect(access.deleters).to.have.members([
				authorGroupId,
				deriveEntityGroupId(topic._id, 'deleters'),
				MessagingAdminGroupId,
			]);
			expect(access.creators).to.deep.equal([]);
		});
	});

	it('covers read, create, edit, and delete for every actor', async () => {
		await stormTester(StormTest_MessagingAcl, async () => {
			const [author, reader, owner, deleter, poster, admin, stranger] = await provisionAccounts(
				email('author'),
				email('reader'),
				email('owner'),
				email('deleter'),
				email('poster'),
				email('admin'),
				email('stranger'),
			);
			const topic = await asAccount(author, () => createTopicForTest());
			await grantTopicBucket(topic._id, reader._id, 'readers');
			await grantTopicBucket(topic._id, owner._id, 'readers');
			await grantTopicBucket(topic._id, owner._id, 'owners');
			await grantTopicBucket(topic._id, deleter._id, 'readers');
			await grantTopicBucket(topic._id, deleter._id, 'deleters');
			await grantTopicBucket(topic._id, poster._id, 'readers');
			await grantTopicBucket(topic._id, poster._id, 'writers');
			await addAccountToGroup(admin._id, MessagingAdminGroupId);

			const actors: Record<ActorName, DB_Account> = {author, reader, owner, deleter, poster, admin, stranger};
			const message = await asAccount(author, () => ModuleBE_MessageDB.create.item({
				topicId: topic._id,
				text: 'original',
			}));

			for (const name of Object.keys(actors) as ActorName[]) {
				const found = await asAccount(actors[name], () => ModuleBE_MessageDB.query.unique(message._id));
				expect(!!found, `${name} read`).to.equal(readAllowed[name]);
			}

			for (const name of Object.keys(actors) as ActorName[]) {
				const attempt = () => asAccount(actors[name], () => ModuleBE_MessageDB.create.item({
					topicId: topic._id,
					text: `create ${name}`,
				}));
				if (createAllowed[name]) {
					const created = await attempt();
					expect(created._auditorId, `${name} create`).to.equal(actors[name]._id);
				} else
					await expectForbidden(attempt);
			}

			for (const name of Object.keys(editAllowed) as ActorName[]) {
				if (editAllowed[name])
					continue;

				await expectForbidden(() => asAccount(actors[name], () => ModuleBE_MessageDB.set.item({
					...message,
					text: `edit ${name}`,
				})));
			}

			const edited = await asAccount(author, () => ModuleBE_MessageDB.set.item({
				...message,
				text: 'edited by author',
			}));
			expect(edited.text).to.equal('edited by author');

			const own = await asAccount(poster, () => ModuleBE_MessageDB.create.item({
				topicId: topic._id,
				text: 'poster own',
			}));
			const ownEdited = await asAccount(poster, () => ModuleBE_MessageDB.set.item({
				...own,
				text: 'poster edited own',
			}));
			expect(ownEdited.text).to.equal('poster edited own');
			const ownDeleted = await asAccount(poster, () => ModuleBE_MessageDB.delete.unique(own._id));
			expect(ownDeleted?._id).to.equal(own._id);

			for (const name of Object.keys(deleteAllowed) as ActorName[]) {
				if (deleteAllowed[name])
					continue;

				await expectForbidden(() => asAccount(actors[name], () => ModuleBE_MessageDB.delete.unique(message._id)));
			}

			for (const name of ['deleter', 'admin', 'author'] as const) {
				const target = await asAccount(author, () => ModuleBE_MessageDB.create.item({
					topicId: topic._id,
					text: `delete by ${name}`,
				}));
				const deleted = await asAccount(actors[name], () => ModuleBE_MessageDB.delete.unique(target._id));
				expect(deleted?._id, `${name} delete`).to.equal(target._id);
			}
		});
	});
});
