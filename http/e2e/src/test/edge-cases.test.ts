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

describe('E2E edge cases', () => {
	before(() => ensureBeLoggedTerminal());
	beforeEach(() => killProcessOnPort(E2EPort));

	it('Empty string query param vs missing param - server echoes consistently', async () => {
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
		try {
			const client = new HttpClient({origin});
			// setUrlParams filters out falsy values, so {a: ''} is sent as no param; server echoes {}.
			const resOmitted = await client.createRequest(apiDef).setUrlParams({a: ''}).execute() as Record<string, string>;
			expect(resOmitted).to.not.have.property('a');
			const resPresent = await client.createRequest(apiDef).setUrlParams({a: 'x'}).execute() as Record<string, string>;
			expect(resPresent).to.deep.equal({a: 'x'});
		} finally {
			await server.terminate();
		}
	});

	it('Special characters in query - round-trip correctly', async () => {
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
		const res = await client.createRequest(apiDef).setUrlParams({x: 'a b', y: 'c%20d'}).execute() as Record<string, string>;
		expect(res.x).to.equal('a b');
		expect(res.y).to.equal('c%20d');
		await server.terminate();
	});

	it('Unicode in body - server echoes, client receives same string', async () => {
		const server = createE2EServer();
		await server.init();
		const apiDef = {method: 'post' as const, path: '/echo-body'};

		class EchoBody {
			@ApiHandler(() => apiDef, {httpServer: () => server})
			async post(body: { text: string }) {
				return body;
			}
		}

		new EchoBody();
		await server.startServer();

		const client = new HttpClient({origin});
		const payload = {text: 'Hello 世界 café emoji: 🎉'};
		const res = await client.createRequest(apiDef).setBodyAsJson(payload).execute();
		expect(res).to.deep.equal(payload);
		await server.terminate();
	});

	it('Connection refused - client calls wrong port, fails with connection error', async () => {
		// Do not start server; use a port that nothing listens on (E2EPort after killProcessOnPort)
		killProcessOnPort(E2EPort);
		const client = new HttpClient({origin, timeout: 2000});
		try {
			await client.createRequest({method: 'get', path: '/any'}).setUrlParams({}).execute();
			expect.fail('expected connection error');
		} catch (e) {
			expect(e).to.be.instanceOf(Error);
			if (e instanceof HttpException) {
				// Client may report connection refused as 0 (network error) or 500 (no response)
				expect([0, 500]).to.include(e.responseCode);
				expect(e.responseCode).to.not.equal(200);
			}
		}
	});

	it('Content-Type application/json - server receives and parses JSON', async () => {
		const server = createE2EServer();
		await server.init();
		const apiDef = {method: 'post' as const, path: '/echo-body'};

		class EchoBody {
			@ApiHandler(() => apiDef, {httpServer: () => server})
			async post(body: { n: number }) {
				return body;
			}
		}

		new EchoBody();
		await server.startServer();

		const client = new HttpClient({origin});
		const res = await client.createRequest(apiDef).setBodyAsJson({n: 99}).execute();
		expect(res).to.deep.equal({n: 99});
		await server.terminate();
	});
});
