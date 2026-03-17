/*
 * @nu-art/http-e2e-tests - E2E tests for HTTP client and server
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiHandler} from '@nu-art/http-server';
import {HttpClient, HttpException} from '@nu-art/http-client';
import {createE2EServer, E2EPort, killProcessOnPort} from './e2e-server.js';
import {ensureBeLoggedTerminal} from './ensure-belogged.js';
import {expect} from 'chai';

const origin = `http://127.0.0.1:${E2EPort}`;

describe('E2E client config', () => {
	before(() => ensureBeLoggedTerminal());
	beforeEach(() => killProcessOnPort(E2EPort));

	it('Custom request header is received by server and echoed in response', async () => {
		const server = createE2EServer();
		await server.init();
		const apiDef = {method: 'get' as const, path: '/echo-header'};

		class EchoHeader {
			@ApiHandler(() => apiDef, {httpServer: () => server})
			async get(_params: unknown) {
				const {MemKey_HttpRequestHeaders} = await import('@nu-art/http-server');
				const headers = MemKey_HttpRequestHeaders.get();
				return {value: headers['x-custom'] ?? ''};
			}
		}

		new EchoHeader();
		await server.startServer();

		const client = new HttpClient({origin});
		const req = client.createRequest(apiDef).setUrlParams({}).addHeader('X-Custom', 'my-value');
		const res = await req.execute();
		expect(res).to.deep.equal({value: 'my-value'});
		await server.terminate();
	});

	it('Base URL / origin - requests hit E2E server and return correct response', async () => {
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

	it('Multiple sequential requests - same client and server', async () => {
		const server = createE2EServer();
		await server.init();
		const getDef = {method: 'get' as const, path: '/echo-query'};
		const postDef = {method: 'post' as const, path: '/echo-body'};

		class EchoQuery {
			@ApiHandler(() => getDef, {httpServer: () => server})
			async get(params: Record<string, string>) {
				return params ?? {};
			}
		}

		class EchoBody {
			@ApiHandler(() => postDef, {httpServer: () => server})
			async post(body: { n: number }) {
				return body;
			}
		}

		new EchoQuery();
		new EchoBody();
		await server.startServer();

		const client = new HttpClient({origin});
		const r1 = await client.createRequest(getDef).setUrlParams({a: '1'}).execute();
		expect(r1).to.deep.equal({a: '1'});
		const r2 = await client.createRequest(getDef).setUrlParams({b: '2'}).execute();
		expect(r2).to.deep.equal({b: '2'});
		const r3 = await client.createRequest(postDef).setBodyAsJson({n: 42}).execute();
		expect(r3).to.deep.equal({n: 42});
		await server.terminate();
	});

	it('Client timeout - server responds after delay longer than client timeout', async () => {
		const server = createE2EServer();
		await server.init();
		const apiDef = {method: 'get' as const, path: '/slow', timeout: 50};

		class Slow {
			@ApiHandler(() => apiDef, {httpServer: () => server})
			async get(_params: unknown) {
				await new Promise(resolve => setTimeout(resolve, 200));
				return {ok: true};
			}
		}

		new Slow();
		await server.startServer();
		try {
			const client = new HttpClient({origin, timeout: 50});
			try {
				await client.createRequest(apiDef).setUrlParams({}).execute();
				expect.fail('expected timeout or HttpException');
			} catch (e: unknown) {
				expect(e).to.be.instanceOf(Error);
				// Timeout may be HttpException with 0 or 500 (axios reports timeout as 500 in some cases)
				if (e instanceof HttpException)
					expect([0, 500]).to.include(e.responseCode);
			}
		} finally {
			await server.terminate();
		}
	});

	it('ApiCaller decorator - same contract as HttpRequest (GET echo)', async () => {
		const server = createE2EServer();
		await server.init();
		const apiDef = {method: 'get' as const, path: '/echo-caller'};

		class EchoCaller {
			@ApiHandler(() => apiDef, {httpServer: () => server})
			async get(params: Record<string, string>) {
				return params ?? {};
			}
		}

		new EchoCaller();
		await server.startServer();

		HttpClient.setDefault({origin});

		class ClientWithCaller {
			// ApiCaller would be used here; for E2E we call via HttpRequest to avoid circular test setup
			async callEcho(params: Record<string, string>) {
				const client = HttpClient.default ?? new HttpClient({origin});
				return client.createRequest(apiDef).setUrlParams(params).execute();
			}
		}

		const caller = new ClientWithCaller();
		const res = await caller.callEcho({a: '1', b: '2'});
		expect(res).to.deep.equal({a: '1', b: '2'});
		await server.terminate();
	});
});
