/*
 * @nu-art/db-api-backend - API tests for ModuleBE_BaseApi with mocked collection
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {ApiException} from '@nu-art/ts-common';
import {CrudApiDef} from '@nu-art/db-api-shared';
import {HttpServer} from '@nu-art/http-server';
import {createMockDbModuleForApi} from './mocks/MockDbModuleForApi.js';
import {createApisForDBModule, ModuleBE_BaseApi_Class} from '../main/ModuleBE_BaseApi.js';

const testServerConfig = {
	tag: 'test',
	port: 0,
	baseUrl: '',
	cors: {headers: [], responseHeaders: []}
};

function setupApi(): { api: ModuleBE_BaseApi_Class<any>; db: ReturnType<typeof createMockDbModuleForApi> } {
	const db = createMockDbModuleForApi();
	const crudApiDef = CrudApiDef(db.dbDef.dbKey);
	const httpServer = new HttpServer(testServerConfig);
	const api = new ModuleBE_BaseApi_Class({
		dbModule: db as any,
		crudApiDef: crudApiDef,
		httpServer: () => httpServer
	});
	return {api, db};
}

describe('ModuleBE_BaseApi', () => {
	describe('query', () => {
		it('returns empty array when store is empty', async () => {
			const {api} = setupApi();
			const items = await api.query({where: {}});
			expect(items).to.deep.equal([]);
		});

		it('returns items matching query after upserts', async () => {
			const {api} = setupApi();
			await api.upsert({_id: 'id1', name: 'A', _v: 'v1'});
			await api.upsert({_id: 'id2', name: 'B', _v: 'v1'});
			const items = await api.query({where: {}});
			expect(items).to.have.length(2);
		});

		it('filters by where clause', async () => {
			const {api} = setupApi();
			await api.upsert({_id: 'id1', name: 'A', tag: 'x', _v: 'v1'});
			await api.upsert({_id: 'id2', name: 'B', tag: 'y', _v: 'v1'});
			await api.upsert({_id: 'id3', name: 'C', tag: 'x', _v: 'v1'});
			const items = await api.query({where: {tag: 'x'}} as any);
			expect(items).to.have.length(2);
			expect(items.map((i: { _id: string }) => i._id).sort()).to.deep.equal(['id1', 'id3']);
		});

		it('returns empty array when where matches nothing', async () => {
			const {api} = setupApi();
			await api.upsert({_id: 'id1', name: 'A', _v: 'v1'});
			const items = await api.query({where: {name: 'Nonexistent'}} as any);
			expect(items).to.deep.equal([]);
		});
	});

	describe('queryUnique', () => {
		it('returns item when _id exists', async () => {
			const {api} = setupApi();
			await api.upsert({_id: 'id1', _v: 'v1'});
			const item = await api.queryUnique({_id: 'id1'});
			expect(item).to.not.be.undefined;
			expect(item._id).to.equal('id1');
		});

		it('throws ApiException 404 when _id does not exist', async () => {
			const {api} = setupApi();
			try {
				await api.queryUnique({_id: 'nonexistent'});
				expect.fail('expected ApiException');
			} catch (e) {
				expect(e).to.be.instanceOf(ApiException);
				expect((e as ApiException).responseCode).to.equal(404);
				expect((e as Error).message).to.include('Could not find');
				expect((e as Error).message).to.include('nonexistent');
			}
		});

		it('404 message includes entity name', async () => {
			const {api} = setupApi();
			try {
				await api.queryUnique({_id: 'missing'});
				expect.fail('expected ApiException');
			} catch (e) {
				expect(e).to.be.instanceOf(ApiException);
				expect((e as Error).message).to.include('TestEntity');
			}
		});
	});

	describe('upsert', () => {
		it('saves item and returns it', async () => {
			const {api} = setupApi();
			const body = {_id: 'id1', name: 'Test', _v: 'v1'};
			const result = await api.upsert(body);
			expect(result._id).to.equal('id1');
			const found = await api.queryUnique({_id: 'id1'});
			expect(found).to.deep.include({_id: 'id1'});
		});

		it('overwrites existing item when same _id', async () => {
			const {api} = setupApi();
			await api.upsert({_id: 'id1', name: 'First', _v: 'v1'});
			const result = await api.upsert({_id: 'id1', name: 'Second', _v: 'v1'});
			expect(result.name).to.equal('Second');
			const found = await api.queryUnique({_id: 'id1'});
			expect(found.name).to.equal('Second');
		});
	});

	describe('upsertAll', () => {
		it('saves all items and returns array', async () => {
			const {api} = setupApi();
			const bodies = [
				{_id: 'a', _v: 'v1'},
				{_id: 'b', _v: 'v1'}
			];
			const result = await api.upsertAll(bodies);
			expect(result).to.have.length(2);
			const items = await api.query({where: {}});
			expect(items).to.have.length(2);
		});

		it('returns empty array when given empty array', async () => {
			const {api} = setupApi();
			const result = await api.upsertAll([]);
			expect(result).to.deep.equal([]);
		});

		it('single item array works', async () => {
			const {api} = setupApi();
			const result = await api.upsertAll([{_id: 'only', _v: 'v1'}]);
			expect(result).to.have.length(1);
			expect(result[0]._id).to.equal('only');
		});
	});

	describe('delete', () => {
		it('removes item and returns it', async () => {
			const {api} = setupApi();
			await api.upsert({_id: 'id1', _v: 'v1'});
			const deleted = await api.delete({_id: 'id1'});
			expect(deleted).to.not.be.undefined;
			expect(deleted!._id).to.equal('id1');
			try {
				await api.queryUnique({_id: 'id1'});
				expect.fail('expected 404');
			} catch (e) {
				expect(e).to.be.instanceOf(ApiException);
				expect((e as ApiException).responseCode).to.equal(404);
			}
		});

		it('returns undefined when _id does not exist', async () => {
			const {api} = setupApi();
			const deleted = await api.delete({_id: 'nonexistent'});
			expect(deleted).to.be.undefined;
		});
	});

	describe('deleteQuery', () => {
		it('throws 400 when query has no where', async () => {
			const {api} = setupApi();
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
			const {api} = setupApi();
			try {
				await api.deleteQuery({where: {foo: undefined}} as any);
				expect.fail('expected ApiException');
			} catch (e) {
				expect(e).to.be.instanceOf(ApiException);
				expect((e as ApiException).responseCode).to.equal(400);
				expect((e as Error).message).to.include('undefined or null');
			}
		});

		it('deletes matching items and returns them', async () => {
			const {api} = setupApi();
			await api.upsert({_id: 'id1', tag: 'x', _v: 'v1'});
			await api.upsert({_id: 'id2', tag: 'x', _v: 'v1'});
			await api.upsert({_id: 'id3', tag: 'y', _v: 'v1'});
			const deleted = await api.deleteQuery({where: {tag: 'x'}} as any);
			expect(deleted).to.have.length(2);
			const remaining = await api.query({where: {}});
			expect(remaining).to.have.length(1);
			expect(remaining[0]._id).to.equal('id3');
		});

		it('returns empty array when no items match where', async () => {
			const {api} = setupApi();
			await api.upsert({_id: 'id1', tag: 'a', _v: 'v1'});
			const deleted = await api.deleteQuery({where: {tag: 'b'}} as any);
			expect(deleted).to.deep.equal([]);
			const remaining = await api.query({where: {}});
			expect(remaining).to.have.length(1);
		});
	});

	describe('deleteAll', () => {
		it('deletes all items and returns them', async () => {
			const {api} = setupApi();
			await api.upsert({_id: 'id1', _v: 'v1'});
			await api.upsert({_id: 'id2', _v: 'v1'});
			const deleted = await api.deleteAll();
			expect(deleted).to.have.length(2);
			const items = await api.query({where: {}});
			expect(items).to.deep.equal([]);
		});

		it('returns empty array when store is already empty', async () => {
			const {api} = setupApi();
			const deleted = await api.deleteAll();
			expect(deleted).to.deep.equal([]);
		});
	});

	describe('createApisForDBModule', () => {
		it('creates working api with default CrudApiDef', async () => {
			const db = createMockDbModuleForApi();
			const api = createApisForDBModule(db);
			await api.upsert({_id: 'x', _v: 'v1'} as any);
			const items = await api.query({where: {}});
			expect(items).to.have.length(1);
			expect(items[0]._id).to.equal('x');
		});
	});

	describe('round-trip', () => {
		it('create, query, upsert again, query, delete, then 404', async () => {
			const {api} = setupApi();
			await api.upsert({_id: 'r1', name: 'Initial', _v: 'v1'});
			let items = await api.query({where: {}});
			expect(items).to.have.length(1);
			expect(items[0].name).to.equal('Initial');

			await api.upsert({_id: 'r1', name: 'Updated', _v: 'v1'});
			items = await api.query({where: {}});
			expect(items).to.have.length(1);
			expect(items[0].name).to.equal('Updated');

			const deleted = await api.delete({_id: 'r1'});
			expect(deleted!._id).to.equal('r1');
			items = await api.query({where: {}});
			expect(items).to.deep.equal([]);

			try {
				await api.queryUnique({_id: 'r1'});
				expect.fail('expected 404');
			} catch (e) {
				expect(e).to.be.instanceOf(ApiException);
				expect((e as ApiException).responseCode).to.equal(404);
			}
		});
	});
});
