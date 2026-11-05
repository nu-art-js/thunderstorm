/*
 * @nu-art/permissions-backend - New documents keep an admin reader
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {MemStorage} from '@nu-art/ts-common/mem-storage';
import {hashToUniqueId} from '@nu-art/db-api-shared';
import type {DatabaseDef_AccessGroup, DocumentAccessFields, DocumentAccessInner} from '@nu-art/permissions-shared';
import {AccessScope_Self} from '@nu-art/permissions-shared';
import {MemKey_UserAccessIds} from '../main/consts.js';
import {wireDocumentAccess} from '../main/document-access-enforcement.js';

const adminGroupId = hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>('group/permissions-admin');

type PreWrite = (item: Record<string, unknown>, original?: Record<string, unknown>) => Promise<void> | void;
type Query = (query: {where?: Record<string, unknown>}) => {where?: Record<string, unknown>};

const wire = (resolver?: () => DocumentAccessFields) => {
	const preWrites: PreWrite[] = [];
	const queries: Query[] = [];
	const db = {
		collection: {validateItem() {}},
		registerPreWriteInterceptor(fn: PreWrite) { preWrites.push(fn); },
		registerQueryInterceptor(fn: Query) { queries.push(fn); },
		registerPreDeleteInterceptor() {},
	};
	wireDocumentAccess(db as never, () => resolver, () => undefined);
	return {preWrite: preWrites.at(-1)!, query: queries.at(-1)!};
};

describe('document access admin stamp', () => {
	it('adds the permissions-admin group to readers on a new document', async () => {
		const {preWrite, query} = wire();
		await new MemStorage().init(async () => {
			MemKey_UserAccessIds.set({[AccessScope_Self]: ['caller-group']});
			const item: {title: string; __access?: DocumentAccessInner} = {title: 'fresh'};
			await preWrite(item);
			expect(item.__access?.readers).to.include('caller-group');
			expect(item.__access?.readers).to.include(adminGroupId);

			MemKey_UserAccessIds.set({
				[AccessScope_Self]: ['admin-person'],
				'permissions-admin': [adminGroupId],
			});
			const filtered = query({where: {}});
			const readers = (filtered.where?.__access as {readers: {$aca: string[]}}).readers.$aca;
			expect(readers).to.include(adminGroupId);
		});
	});

	it('adds the admin reader when a resolver omits it', async () => {
		const {preWrite} = wire(() => ({
			__access: {
				readers: ['owner-group'],
				writers: ['owner-group'],
				creators: [],
				deleters: [],
				owners: ['owner-group'],
			},
		}));
		await new MemStorage().init(async () => {
			MemKey_UserAccessIds.set({[AccessScope_Self]: ['caller-group']});
			const item: {title: string; __access?: DocumentAccessInner} = {title: 'resolved'};
			await preWrite(item);
			expect(item.__access?.readers).to.include('owner-group');
			expect(item.__access?.readers).to.include(adminGroupId);
		});
	});

	it('leaves an existing document stamp unchanged', async () => {
		const {preWrite} = wire();
		await new MemStorage().init(async () => {
			MemKey_UserAccessIds.set({[AccessScope_Self]: ['caller-group']});
			const original = {
				__access: {
					readers: ['caller-group'],
					writers: ['caller-group'],
					creators: ['caller-group'],
					deleters: ['caller-group'],
					owners: ['caller-group'],
				},
			};
			const item: {title: string; __access?: DocumentAccessInner} = {title: 'edit', __access: {readers: ['intruder'], writers: [], creators: [], deleters: [], owners: []}};
			await preWrite(item, original);
			expect(item.__access?.readers).to.deep.equal(['caller-group']);
		});
	});
});
