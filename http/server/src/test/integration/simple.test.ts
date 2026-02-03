/*
 * @nu-art/http-server - Express HTTP server and typed ServerApi
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import request from 'supertest';
import {ApiHandler} from '../../main/index.js';
import {ensureBeLoggedTerminal} from '../ensure-belogged.js';
import {createTestServer} from './test-server.js';
import {expect} from 'chai';

const pingApiDef = {method: 'get' as const, path: '/ping'};

describe('HttpServer integration - Supertest (in-process)', () => {
	before(() => ensureBeLoggedTerminal());

	it('GET /ping returns 200 and JSON { ok: true }', async () => {
		const server = createTestServer();
		await server.init();

		class PingApi {
			@ApiHandler(() => pingApiDef, {httpServer: () => server})
			async get(_params: unknown): Promise<{ ok: boolean }> {
				return {ok: true};
			}
		}
		new PingApi();

		const res = await request(server.getExpress())
			.get('/ping')
			.expect(200)
			.expect('Content-Type', /json/);
		expect(res.body).to.deep.equal({ok: true});
	});

	it('GET unknown path returns 404', async () => {
		const server = createTestServer();
		await server.init();

		class PingOnly {
			@ApiHandler(() => pingApiDef, {httpServer: () => server})
			async get(_params: unknown): Promise<{ ok: boolean }> {
				return {ok: true};
			}
		}
		new PingOnly();

		const res = await request(server.getExpress()).get('/nonexistent');
		expect(res.status).to.equal(404);
	});

	it('GET /ping response has content-type application/json', async () => {
		const server = createTestServer();
		await server.init();

		class PingApi {
			@ApiHandler(() => pingApiDef, {httpServer: () => server})
			async get(_params: unknown): Promise<{ ok: boolean }> {
				return {ok: true};
			}
		}
		new PingApi();

		const res = await request(server.getExpress()).get('/ping');
		expect(res.headers['content-type']).to.match(/application\/json/);
	});
});
