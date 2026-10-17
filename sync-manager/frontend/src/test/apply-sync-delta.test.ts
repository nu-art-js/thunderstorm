/*
 * @nu-art/sync-manager-frontend — Apply a request write set
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import type {DB_Object} from '@nu-art/ts-common';
import {applySyncDelta, type SyncDeltaTarget} from '../main/apply-sync-delta.js';

const doc = (id: string): DB_Object => ({_id: id, __created: 1, __updated: 2});

const target = (): SyncDeltaTarget & {updated: DB_Object[]; deleted: DB_Object[]} => {
	const state = {updated: [] as DB_Object[], deleted: [] as DB_Object[]};
	return {
		...state,
		onEntriesUpdated: async items => {
			state.updated.push(...items);
		},
		onEntriesDeleted: async items => {
			state.deleted.push(...items);
		},
	};
};

describe('applySyncDelta', () => {
	it('writes and deletes per collection and skips an empty side', async () => {
		const clients = target();
		const other = target();
		await applySyncDelta([
			{dbKey: 'mcp--clients', toUpdate: [doc('a')], toDelete: []},
			{dbKey: 'other', toUpdate: [], toDelete: [doc('b')]},
		], dbKey => dbKey === 'mcp--clients' ? clients : other);

		expect(clients.updated).to.deep.equal([doc('a')]);
		expect(clients.deleted).to.deep.equal([]);
		expect(other.updated).to.deep.equal([]);
		expect(other.deleted).to.deep.equal([doc('b')]);
	});

	it('fails when the collection has no frontend module', async () => {
		try {
			await applySyncDelta([{dbKey: 'missing', toUpdate: [doc('a')], toDelete: []}], () => undefined);
			expect.fail('missing module should throw');
		} catch (err: unknown) {
			expect((err as Error).message).to.match(/missing/);
		}
	});
});
