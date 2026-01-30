/*
 * @nu-art/http-server - Express HTTP server and typed ServerApi
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import request from 'supertest';
import {ApiHandler} from '../../main/index.js';
import {ensureBeLoggedTerminal} from '../ensure-belogged.js';
import {createTestServer, killProcessOnPort, TestPort} from './test-server.js';
import {expect} from 'chai';

const pingApiDef = {method: 'get' as const, path: '/ping'};

describe('HttpServer integration - Supertest', () => {
	before(() => {
		ensureBeLoggedTerminal();
		killProcessOnPort(TestPort);
	});

	it('GET /ping returns 200 and JSON { ok: true } (supertest)', async () => {
		const server = createTestServer();
		await server.init();

		class PingApi {
			@ApiHandler(() => pingApiDef, {server: () => server})
			async get(_params: unknown): Promise<{ ok: boolean }> {
				return {ok: true};
			}
		}
		new PingApi();

		await server.startServer();
		try {
			const res = await request(`http://127.0.0.1:${TestPort}`)
				.get('/ping')
				.expect(200)
				.expect('Content-Type', /json/);
			expect(res.body).to.deep.equal({ok: true});
		} finally {
			await server.terminate();
		}
	}).timeout(10000);

	it('GET /ping returns 200 and JSON { ok: true } (fetch)', async () => {
		const server = createTestServer();
		await server.init();

		class PingApiFetch {
			@ApiHandler(() => pingApiDef, {server: () => server})
			async get(_params: unknown): Promise<{ ok: boolean }> {
				return {ok: true};
			}
		}
		new PingApiFetch();

		await server.startServer();
		try {
			const res = await fetch(`http://127.0.0.1:${TestPort}/ping`);
			expect(res.status).to.equal(200);
			expect(res.headers.get('content-type')).to.match(/json/);
			const body = await res.json();
			expect(body).to.deep.equal({ok: true});
		} finally {
			await server.terminate();
		}
	}).timeout(10000);

	it('GET unknown path returns 404', async () => {
		const server = createTestServer();
		await server.init();

		class PingOnly {
			@ApiHandler(() => pingApiDef, {server: () => server})
			async get(_params: unknown): Promise<{ ok: boolean }> {
				return {ok: true};
			}
		}
		new PingOnly();

		await server.startServer();
		try {
			const res = await request(`http://127.0.0.1:${TestPort}`).get('/nonexistent');
			expect(res.status).to.equal(404);
		} finally {
			await server.terminate();
		}
	}).timeout(10000);

	it('GET /ping response has content-type application/json', async () => {
		const server = createTestServer();
		await server.init();

		class PingApi {
			@ApiHandler(() => pingApiDef, {server: () => server})
			async get(_params: unknown): Promise<{ ok: boolean }> {
				return {ok: true};
			}
		}
		new PingApi();

		await server.startServer();
		try {
			const res = await request(`http://127.0.0.1:${TestPort}`).get('/ping');
			expect(res.headers['content-type']).to.match(/application\/json/);
		} finally {
			await server.terminate();
		}
	}).timeout(10000);
});
