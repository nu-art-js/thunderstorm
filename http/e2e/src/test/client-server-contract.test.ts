/*
 * @nu-art/http-e2e-tests - E2E tests for HTTP client and server
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiHandler} from '@nu-art/http-server';
import {HttpClient} from '@nu-art/http-client';
import {createE2EServer, E2EPort, killProcessOnPort} from './e2e-server.js';
import {ensureBeLoggedTerminal} from './ensure-belogged.js';
import {expect} from 'chai';

const origin = `http://127.0.0.1:${E2EPort}`;

describe('E2E client-server contract', () => {
	before(() => ensureBeLoggedTerminal());
	beforeEach(() => killProcessOnPort(E2EPort));

	it('GET with single query param returns 200 and body matches param', async () => {
		const server = createE2EServer();
		await server.init();
		const apiDef = {method: 'get' as const, path: '/echo-one'};
		class EchoOne {
			@ApiHandler(() => apiDef, {httpServer: () => server})
			async get(params: { a?: string }) {
				return {a: params?.a ?? ''};
			}
		}
		new EchoOne();
		await server.startServer();

		const client = new HttpClient({origin});
		const res = await client.createRequest(apiDef).setUrlParams({a: 'x'}).execute();
		expect(res).to.deep.equal({a: 'x'});
		await server.terminate();
	});

	it('GET with multiple query params returns 200 and body equals params', async () => {
		const server = createE2EServer();
		await server.init();
		const apiDef = {method: 'get' as const, path: '/echo-query'};
		class EchoQuery {
			@ApiHandler(() => apiDef, {httpServer: () => server})
			async get(params: Record<string, string>) {
				return params ?? {};
			}
		}
		new EchoQuery();
		await server.startServer();

		const client = new HttpClient({origin});
		const res = await client.createRequest(apiDef).setUrlParams({a: '1', b: '2'}).execute();
		expect(res).to.deep.equal({a: '1', b: '2'});
		await server.terminate();
	});

	it('GET with no query params returns 200 with predictable body', async () => {
		const server = createE2EServer();
		await server.init();
		const apiDef = {method: 'get' as const, path: '/ping'};
		class Ping {
			@ApiHandler(() => apiDef, {httpServer: () => server})
			async get(_params: unknown) {
				return {ok: true};
			}
		}
		new Ping();
		await server.startServer();

		const client = new HttpClient({origin});
		const res = await client.createRequest(apiDef).setUrlParams({}).execute();
		expect(res).to.deep.equal({ok: true});
		await server.terminate();
	});

	it('DELETE with query params returns 200 and body echoes params', async () => {
		const server = createE2EServer();
		await server.init();
		const apiDef = {method: 'delete' as const, path: '/echo-delete'};
		class EchoDelete {
			@ApiHandler(() => apiDef, {httpServer: () => server})
			async delete(params: Record<string, string>) {
				return params ?? {};
			}
		}
		new EchoDelete();
		await server.startServer();

		const client = new HttpClient({origin});
		const res = await client.createRequest(apiDef).setUrlParams({id: '123'}).execute();
		expect(res).to.deep.equal({id: '123'});
		await server.terminate();
	});

	it('POST with JSON body returns 200 and body echoes request body', async () => {
		const server = createE2EServer();
		await server.init();
		const apiDef = {method: 'post' as const, path: '/echo-body'};
		class EchoBody {
			@ApiHandler(() => apiDef, {httpServer: () => server})
			async post(body: { x: number }) {
				return body;
			}
		}
		new EchoBody();
		await server.startServer();

		const client = new HttpClient({origin});
		const res = await client.createRequest(apiDef).setBodyAsJson({x: 42}).execute();
		expect(res).to.deep.equal({x: 42});
		await server.terminate();
	});

	it('POST with empty JSON body returns 200 and server handles gracefully', async () => {
		const server = createE2EServer();
		await server.init();
		const apiDef = {method: 'post' as const, path: '/echo-empty'};
		class EchoEmpty {
			@ApiHandler(() => apiDef, {httpServer: () => server})
			async post(body: Record<string, unknown>) {
				return {received: body ?? {}};
			}
		}
		new EchoEmpty();
		await server.startServer();

		const client = new HttpClient({origin});
		const res = await client.createRequest(apiDef).setBodyAsJson({}).execute();
		expect(res).to.have.property('received');
		await server.terminate();
	});

	it('PUT with JSON body returns 200 and body echoes', async () => {
		const server = createE2EServer();
		await server.init();
		const apiDef = {method: 'put' as const, path: '/echo-put'};
		class EchoPut {
			@ApiHandler(() => apiDef, {httpServer: () => server})
			async put(body: { key: string }) {
				return body;
			}
		}
		new EchoPut();
		await server.startServer();

		const client = new HttpClient({origin});
		const res = await client.createRequest(apiDef).setBodyAsJson({key: 'value'}).execute();
		expect(res).to.deep.equal({key: 'value'});
		await server.terminate();
	});

	it('GET returning 204 No Content - client receives 204 and no body', async () => {
		const server = createE2EServer();
		await server.init();
		const apiDef = {method: 'get' as const, path: '/empty'};
		class EmptyApi {
			@ApiHandler(() => apiDef, {httpServer: () => server})
			async get(_params: unknown) {
				const {MemKey_HttpResponse} = await import('@nu-art/http-server');
				MemKey_HttpResponse.get().code(204);
			}
		}
		new EmptyApi();
		await server.startServer();

		const client = new HttpClient({origin});
		const req = client.createRequest(apiDef).setUrlParams({});
		await req.execute();
		expect(req.getStatus()).to.equal(204);
		await server.terminate();
	});
});
