/*
 * @nu-art/db-api-backend - API tests for ModuleBE_BaseApi with mocked collection
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {ApiException} from '@nu-art/ts-common';
import {CrudApiDef} from '@nu-art/db-api-shared';
import {createMockFirestoreCollectionV3} from './mocks/MockFirestoreCollectionV3.js';
import * as TestDB from './TestModuleBE_BaseDB.js';
import {ModuleBE_BaseApi_Class} from '../main/ModuleBE_BaseApi.js';

function setupApi(): { api: ModuleBE_BaseApi_Class<any>; db: InstanceType<typeof TestDB.TestModuleBE_BaseDB_Class> } {
	const mockCollection = createMockFirestoreCollectionV3();
	const db = new TestDB.TestModuleBE_BaseDB_Class();
	TestDB.wireMockCollection(db, mockCollection);
	const api = new ModuleBE_BaseApi_Class({
		dbModule: db as any,
		crudApiDef: CrudApiDef(db.dbDef.dbKey)
	});
	return { api, db };
}

describe('ModuleBE_BaseApi', () => {
	describe('query', () => {
		it('returns empty array when store is empty', async () => {
			const { api } = setupApi();
			const items = await api.query({ where: {} });
			expect(items).to.deep.equal([]);
		});

		it('returns items matching query after upserts', async () => {
			const { api } = setupApi();
			await api.upsert({ _id: 'id1', name: 'A', _v: 'v1' });
			await api.upsert({ _id: 'id2', name: 'B', _v: 'v1' });
			const items = await api.query({ where: {} });
			expect(items).to.have.length(2);
		});
	});

	describe('queryUnique', () => {
		it('returns item when _id exists', async () => {
			const { api } = setupApi();
			await api.upsert({ _id: 'id1', _v: 'v1' });
			const item = await api.queryUnique({ _id: 'id1' });
			expect(item).to.not.be.undefined;
			expect(item._id).to.equal('id1');
		});

		it('throws ApiException 404 when _id does not exist', async () => {
			const { api } = setupApi();
			try {
				await api.queryUnique({ _id: 'nonexistent' });
				expect.fail('expected ApiException');
			} catch (e) {
				expect(e).to.be.instanceOf(ApiException);
				expect((e as ApiException).responseCode).to.equal(404);
				expect((e as Error).message).to.include('Could not find');
				expect((e as Error).message).to.include('nonexistent');
			}
		});
	});

	describe('upsert', () => {
		it('saves item and returns it', async () => {
			const { api } = setupApi();
			const body = { _id: 'id1', name: 'Test', _v: 'v1' };
			const result = await api.upsert(body);
			expect(result._id).to.equal('id1');
			const found = await api.queryUnique({ _id: 'id1' });
			expect(found).to.deep.include({ _id: 'id1' });
		});
	});

	describe('upsertAll', () => {
		it('saves all items and returns array', async () => {
			const { api } = setupApi();
			const bodies = [
				{ _id: 'a', _v: 'v1' },
				{ _id: 'b', _v: 'v1' }
			];
			const result = await api.upsertAll(bodies);
			expect(result).to.have.length(2);
			const items = await api.query({ where: {} });
			expect(items).to.have.length(2);
		});
	});

	describe('delete', () => {
		it('removes item and returns it', async () => {
			const { api } = setupApi();
			await api.upsert({ _id: 'id1', _v: 'v1' });
			const deleted = await api.delete({ _id: 'id1' });
			expect(deleted).to.not.be.undefined;
			expect(deleted!._id).to.equal('id1');
			try {
				await api.queryUnique({ _id: 'id1' });
				expect.fail('expected 404');
			} catch (e) {
				expect(e).to.be.instanceOf(ApiException);
				expect((e as ApiException).responseCode).to.equal(404);
			}
		});
	});

	describe('deleteQuery', () => {
		it('throws 400 when query has no where', async () => {
			const { api } = setupApi();
			try {
				await api.deleteQuery({} as any);
				expect.fail('expected ApiException');
			} catch (e) {
				expect(e).to.be.instanceOf(ApiException);
				expect((e as ApiException).responseCode).to.equal(400);
				expect((e as Error).message).to.include('Cannot delete without a where clause');
			}
		});

		it('throws 400 when where has null or undefined value', async () => {
			const { api } = setupApi();
			try {
				await api.deleteQuery({ where: { foo: undefined } } as any);
				expect.fail('expected ApiException');
			} catch (e) {
				expect(e).to.be.instanceOf(ApiException);
				expect((e as ApiException).responseCode).to.equal(400);
				expect((e as Error).message).to.include('undefined or null');
			}
		});

		it('deletes matching items and returns them', async () => {
			const { api } = setupApi();
			await api.upsert({ _id: 'id1', tag: 'x', _v: 'v1' });
			await api.upsert({ _id: 'id2', tag: 'x', _v: 'v1' });
			await api.upsert({ _id: 'id3', tag: 'y', _v: 'v1' });
			const deleted = await api.deleteQuery({ where: { tag: 'x' } } as any);
			expect(deleted).to.have.length(2);
			const remaining = await api.query({ where: {} });
			expect(remaining).to.have.length(1);
			expect(remaining[0]._id).to.equal('id3');
		});
	});

	describe('deleteAll', () => {
		it('deletes all items and returns them', async () => {
			const { api } = setupApi();
			await api.upsert({ _id: 'id1', _v: 'v1' });
			await api.upsert({ _id: 'id2', _v: 'v1' });
			const deleted = await api.deleteAll();
			expect(deleted).to.have.length(2);
			const items = await api.query({ where: {} });
			expect(items).to.deep.equal([]);
		});
	});
});
