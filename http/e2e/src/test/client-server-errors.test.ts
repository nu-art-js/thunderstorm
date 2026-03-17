/*
 * @nu-art/http-e2e-tests - E2E tests for HTTP client and server
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiException} from '@nu-art/ts-common';
import {ApiHandler} from '@nu-art/http-server';
import {HttpClient, HttpException} from '@nu-art/http-client';
import {createE2EServer, E2EPort, killProcessOnPort} from './e2e-server.js';
import {ensureBeLoggedTerminal} from './ensure-belogged.js';
import {expect} from 'chai';

const origin = `http://127.0.0.1:${E2EPort}`;

describe('E2E client-server errors', () => {
	before(() => ensureBeLoggedTerminal());
	beforeEach(() => killProcessOnPort(E2EPort));

	it('Server returns 400 - client gets HttpException with responseCode 400', async () => {
		const server = createE2EServer();
		await server.init();
		const apiDef = {method: 'get' as const, path: '/err400'};

		class Err400 {
			@ApiHandler(() => apiDef, {httpServer: () => server})
			async get(_params: unknown) {
				throw new ApiException(400, 'bad request');
			}
		}

		new Err400();
		await server.startServer();

		const client = new HttpClient({origin});
		const req = client.createRequest(apiDef).setUrlParams({});
		try {
			await req.execute();
			expect.fail('expected HttpException');
		} catch (e) {
			expect(e).to.be.instanceOf(HttpException);
			expect((e as HttpException).responseCode).to.equal(400);
		}
		await server.terminate();
	});

	it('Server returns 404 - client gets HttpException with 404', async () => {
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
		const wrongDef = {method: 'get' as const, path: '/nonexistent'};
		try {
			await client.createRequest(wrongDef).setUrlParams({}).execute();
			expect.fail('expected HttpException');
		} catch (e) {
			expect(e).to.be.instanceOf(HttpException);
			expect((e as HttpException).responseCode).to.equal(404);
		}
		await server.terminate();
	});

	it('Server returns 401 - client gets 401 and error body', async () => {
		const server = createE2EServer();
		await server.init();
		const apiDef = {method: 'get' as const, path: '/err401'};

		class Err401 {
			@ApiHandler(() => apiDef, {httpServer: () => server})
			async get(_params: unknown) {
				throw new ApiException(401, 'unauthorized');
			}
		}

		new Err401();
		await server.startServer();

		const client = new HttpClient({origin});
		try {
			await client.createRequest(apiDef).setUrlParams({}).execute();
			expect.fail('expected HttpException');
		} catch (e) {
			expect(e).to.be.instanceOf(HttpException);
			expect((e as HttpException).responseCode).to.equal(401);
		}
		await server.terminate();
	});

	it('Server returns 403 - client gets 403 and error body', async () => {
		const server = createE2EServer();
		await server.init();
		const apiDef = {method: 'get' as const, path: '/err403'};

		class Err403 {
			@ApiHandler(() => apiDef, {httpServer: () => server})
			async get(_params: unknown) {
				throw new ApiException(403, 'forbidden');
			}
		}

		new Err403();
		await server.startServer();

		const client = new HttpClient({origin});
		try {
			await client.createRequest(apiDef).setUrlParams({}).execute();
			expect.fail('expected HttpException');
		} catch (e) {
			expect(e).to.be.instanceOf(HttpException);
			expect((e as HttpException).responseCode).to.equal(403);
		}
		await server.terminate();
	});

	it('Server returns 500 - client gets HttpException with 500', async () => {
		const server = createE2EServer();
		await server.init();
		const apiDef = {method: 'get' as const, path: '/err500'};

		class Err500 {
			@ApiHandler(() => apiDef, {httpServer: () => server})
			async get(_params: unknown) {
				throw new Error('server error');
			}
		}

		new Err500();
		await server.startServer();

		const client = new HttpClient({origin});
		try {
			await client.createRequest(apiDef).setUrlParams({}).execute();
			expect.fail('expected HttpException');
		} catch (e) {
			expect(e).to.be.instanceOf(HttpException);
			expect((e as HttpException).responseCode).to.equal(500);
		}
		await server.terminate();
	});
});
