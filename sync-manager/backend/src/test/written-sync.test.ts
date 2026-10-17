/*
 * @nu-art/sync-manager-backend — Request write set
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {type DB_Object} from '@nu-art/ts-common';
import {MemStorage} from '@nu-art/ts-common/mem-storage';
import {emptyWrittenSync, MemKey_WrittenSync, readWrittenSync, recordWrittenSync} from '../main/written-sync.js';

const doc = (id: string, updated: number): DB_Object => ({_id: id, __created: 1, __updated: updated});

describe('written sync', () => {
	it('ignores writes when the request did not open a sync bucket', async () => {
		await new MemStorage().init(async () => {
			recordWrittenSync('mcp--clients', {updated: [doc('a', 1)]});
			expect(() => readWrittenSync()).to.throw(/before it was set/);
		});
	});

	it('keeps the latest update and moves an id to delete', async () => {
		await new MemStorage().init(async () => {
			MemKey_WrittenSync.set(emptyWrittenSync());
			recordWrittenSync('mcp--clients', {updated: [doc('a', 1), doc('b', 1)]});
			recordWrittenSync('mcp--clients', {updated: [doc('a', 2)]});
			recordWrittenSync('mcp--clients', {deleted: [doc('b', 3)]});
			recordWrittenSync('other', {deleted: null});

			expect(readWrittenSync()).to.deep.equal([{
				dbKey: 'mcp--clients',
				toUpdate: [doc('a', 2)],
				toDelete: [doc('b', 3)],
			}]);
		});
	});

	it('records a write that happens inside a transaction child storage', async () => {
		await new MemStorage().init(async () => {
			MemKey_WrittenSync.set(emptyWrittenSync());
			await new MemStorage().init(async () => {
				recordWrittenSync('mcp--clients', {updated: [doc('a', 2)]});
			});

			expect(readWrittenSync()).to.deep.equal([{
				dbKey: 'mcp--clients',
				toUpdate: [doc('a', 2)],
				toDelete: [],
			}]);
		});
	});
});
