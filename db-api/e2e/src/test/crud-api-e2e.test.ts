/*
 * @nu-art/db-api-e2e-tests - E2E tests for db-api CRUD over HTTP
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {HttpClient, HttpException} from '@nu-art/http-client';
import {CrudApiDef} from '@nu-art/db-api-shared';
import {ModuleBE_BaseApi_Class} from '@nu-art/db-api-backend';
import {createE2EServer, E2EPort, killProcessOnPort} from './e2e-server.js';
import {createMockDbModuleForApi} from './mocks/MockDbModuleForApi.js';
import type {DB_Object} from '@nu-art/ts-common';

type E2EItem = DB_Object & { name?: string; tag?: string };

const origin = `http://127.0.0.1:${E2EPort}`;
const DB_KEY = 'test-entity';

/** Setup server (init so body parser is mounted before routes), mock db, and api. Call startServer() in test. */
async function setupE2EServer(): Promise<{
	server: ReturnType<typeof createE2EServer>; db: ReturnType<typeof createMockDbModuleForApi>; crudApiDef: ReturnType<typeof CrudApiDef>
}> {
	const server = createE2EServer();
	await server.init();
	const db = createMockDbModuleForApi(undefined, DB_KEY);
	const crudApiDef = CrudApiDef(DB_KEY);
	const api = new ModuleBE_BaseApi_Class({
		dbModule: db as any,
		crudApiDef,
		httpServer: () => server
	});
	void api;
	await new Promise<void>(r => setImmediate(r));
	return {server, db, crudApiDef};
}

describe('db-api CRUD E2E over HTTP', () => {
	beforeEach(() => killProcessOnPort(E2EPort));

	it('query POST returns 200 and empty array when store is empty', async () => {
		const {server, crudApiDef} = await setupE2EServer();
		await server.startServer();
		try {
			const client = new HttpClient({origin});
			const res = await client.createRequest(crudApiDef.query).setBodyAsJson({where: {}}).execute() as DB_Object[];
			expect(res).to.be.an('array');
			expect(res).to.have.length(0);
		} finally {
			await server.terminate();
		}
	});

	it('upsert POST returns 200 and echoed item', async () => {
		const {server, crudApiDef} = await setupE2EServer();
		await server.startServer();
		try {
			const client = new HttpClient({origin});
			const body = {_id: 'id1', name: 'A', _v: 'v1'};
			const res = await client.createRequest(crudApiDef.upsert).setBodyAsJson(body as any).execute() as E2EItem;
			expect(res._id).to.equal('id1');
			expect(res.name).to.equal('A');
		} finally {
			await server.terminate();
		}
	});

	it('query POST returns items after upserts', async () => {
		const {server, crudApiDef} = await setupE2EServer();
		await server.startServer();
		try {
			const client = new HttpClient({origin});
			await client.createRequest(crudApiDef.upsert).setBodyAsJson({_id: 'a', _v: 'v1'} as any).execute();
			await client.createRequest(crudApiDef.upsert).setBodyAsJson({_id: 'b', _v: 'v1'} as any).execute();
			const res = await client.createRequest(crudApiDef.query).setBodyAsJson({where: {}}).execute() as DB_Object[];
			expect(res).to.have.length(2);
		} finally {
			await server.terminate();
		}
	});

	it('queryUnique GET returns 200 with item when _id exists', async () => {
		const {server, crudApiDef} = await setupE2EServer();
		await server.startServer();
		try {
			const client = new HttpClient({origin});
			await client.createRequest(crudApiDef.upsert).setBodyAsJson({_id: 'x', _v: 'v1'} as any).execute();
			const res = await client.createRequest(crudApiDef.queryUnique).setUrlParams({_id: 'x'} as any).execute() as DB_Object;
			expect(res._id).to.equal('x');
		} finally {
			await server.terminate();
		}
	});

	it('queryUnique GET returns 404 when _id does not exist', async () => {
		const {server, crudApiDef} = await setupE2EServer();
		await server.startServer();
		try {
			const client = new HttpClient({origin});
			try {
				await client.createRequest(crudApiDef.queryUnique).setUrlParams({_id: 'nonexistent'} as any).execute();
				expect.fail('expected HttpException 404');
			} catch (e) {
				expect(e).to.be.instanceOf(HttpException);
				expect((e as HttpException).responseCode).to.equal(404);
			}
		} finally {
			await server.terminate();
		}
	});

	it('upsertAll POST returns 200 and array', async () => {
		const {server, crudApiDef} = await setupE2EServer();
		await server.startServer();
		try {
			const client = new HttpClient({origin});
			const bodies = [{_id: 'p', _v: 'v1'}, {_id: 'q', _v: 'v1'}] as any[];
			const res = await client.createRequest(crudApiDef.upsertAll).setBodyAsJson(bodies).execute() as DB_Object[];
			expect(res).to.have.length(2);
			const items = await client.createRequest(crudApiDef.query).setBodyAsJson({where: {}}).execute() as DB_Object[];
			expect(items).to.have.length(2);
		} finally {
			await server.terminate();
		}
	});

	it('deleteUnique GET returns 200 with deleted item', async () => {
		const {server, crudApiDef} = await setupE2EServer();
		await server.startServer();
		try {
			const client = new HttpClient({origin});
			await client.createRequest(crudApiDef.upsert).setBodyAsJson({_id: 'd1', _v: 'v1'} as any).execute();
			const deleted = await client.createRequest(crudApiDef.deleteUnique).setUrlParams({_id: 'd1'} as any).execute() as DB_Object;
			expect(deleted).to.not.be.undefined;
			expect(deleted._id).to.equal('d1');
			try {
				await client.createRequest(crudApiDef.queryUnique).setUrlParams({_id: 'd1'} as any).execute();
				expect.fail('expected 404');
			} catch (e) {
				expect(e).to.be.instanceOf(HttpException);
				expect((e as HttpException).responseCode).to.equal(404);
			}
		} finally {
			await server.terminate();
		}
	});

	it('deleteQuery POST returns 400 when where missing', async () => {
		const {server, crudApiDef} = await setupE2EServer();
		await server.startServer();
		try {
			const client = new HttpClient({origin});
			try {
				await client.createRequest(crudApiDef.deleteQuery).setBodyAsJson({} as any).execute();
				expect.fail('expected HttpException 400');
			} catch (e) {
				expect(e).to.be.instanceOf(HttpException);
				expect((e as HttpException).responseCode).to.equal(400);
			}
		} finally {
			await server.terminate();
		}
	});

	it('deleteQuery POST returns 200 with deleted items', async () => {
		const {server, crudApiDef} = await setupE2EServer();
		await server.startServer();
		try {
			const client = new HttpClient({origin});
			await client.createRequest(crudApiDef.upsert).setBodyAsJson({_id: 't1', tag: 'x', _v: 'v1'} as any).execute();
			await client.createRequest(crudApiDef.upsert).setBodyAsJson({_id: 't2', tag: 'x', _v: 'v1'} as any).execute();
			await client.createRequest(crudApiDef.upsert).setBodyAsJson({_id: 't3', tag: 'y', _v: 'v1'} as any).execute();
			const deleted = await client.createRequest(crudApiDef.deleteQuery).setBodyAsJson({where: {tag: 'x'}} as any).execute() as DB_Object[];
			expect(deleted).to.have.length(2);
			const remaining = await client.createRequest(crudApiDef.query).setBodyAsJson({where: {}}).execute() as DB_Object[];
			expect(remaining).to.have.length(1);
			expect(remaining[0]._id).to.equal('t3');
		} finally {
			await server.terminate();
		}
	});

	it('deleteAll GET returns 200 with all deleted items', async () => {
		const {server, crudApiDef} = await setupE2EServer();
		await server.startServer();
		try {
			const client = new HttpClient({origin});
			await client.createRequest(crudApiDef.upsert).setBodyAsJson({_id: 'z1', _v: 'v1'} as any).execute();
			await client.createRequest(crudApiDef.upsert).setBodyAsJson({_id: 'z2', _v: 'v1'} as any).execute();
			const deleted = await client.createRequest(crudApiDef.deleteAll).setUrlParams({} as any).execute() as DB_Object[];
			expect(deleted).to.have.length(2);
			const items = await client.createRequest(crudApiDef.query).setBodyAsJson({where: {}}).execute() as DB_Object[];
			expect(items).to.deep.equal([]);
		} finally {
			await server.terminate();
		}
	});

	it('round-trip: upsert via HTTP, query via HTTP, upsert again, delete, then 404', async () => {
		const {server, crudApiDef} = await setupE2EServer();
		await server.startServer();
		try {
			const client = new HttpClient({origin});
			await client.createRequest(crudApiDef.upsert).setBodyAsJson({_id: 'r1', name: 'Initial', _v: 'v1'} as any).execute();
			let items = await client.createRequest(crudApiDef.query).setBodyAsJson({where: {}}).execute() as E2EItem[];
			expect(items).to.have.length(1);
			expect(items[0].name).to.equal('Initial');

			await client.createRequest(crudApiDef.upsert).setBodyAsJson({_id: 'r1', name: 'Updated', _v: 'v1'} as any).execute();
			items = await client.createRequest(crudApiDef.query).setBodyAsJson({where: {}}).execute() as E2EItem[];
			expect(items).to.have.length(1);
			expect(items[0].name).to.equal('Updated');

			await client.createRequest(crudApiDef.deleteUnique).setUrlParams({_id: 'r1'} as any).execute();
			items = await client.createRequest(crudApiDef.query).setBodyAsJson({where: {}}).execute() as E2EItem[];
			expect(items).to.deep.equal([]);

			try {
				await client.createRequest(crudApiDef.queryUnique).setUrlParams({_id: 'r1'} as any).execute();
				expect.fail('expected 404');
			} catch (e) {
				expect(e).to.be.instanceOf(HttpException);
				expect((e as HttpException).responseCode).to.equal(404);
			}
		} finally {
			await server.terminate();
		}
	});
});
