/*
 * @nu-art/http-server - Express HTTP server and typed ServerApi
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import request from 'supertest';
import {expect} from 'chai';
import {ApiHandler, HttpServer, MemKey_HttpRequest} from '../../main/index.js';
import {ensureBeLoggedTerminal} from '../ensure-belogged.js';
import {createTestServer} from './test-server.js';

type RawSeen = { bodyUndefined: boolean; readable: boolean; bytes: string };

/** A raw route that reports what the handler saw, reading the stream itself. */
function addRawRoute(server: HttpServer, path: string) {
	class RawRoute {
		@ApiHandler(() => ({method: 'post' as const, path}), {httpServer: () => server, rawBody: true})
		async post(_body: unknown): Promise<RawSeen> {
			const req = MemKey_HttpRequest.get();
			const bodyUndefined = (req as { body?: unknown }).body === undefined;
			const readable = req.readable;
			const chunks: Buffer[] = [];
			for await (const chunk of req)
				chunks.push(chunk as Buffer);
			return {bodyUndefined, readable, bytes: Buffer.concat(chunks).toString('base64')};
		}
	}

	new RawRoute();
}

function addEchoRoute(server: HttpServer, path: string) {
	class EchoRoute {
		@ApiHandler(() => ({method: 'post' as const, path}), {httpServer: () => server})
		async post(body: unknown) {
			return {body, type: typeof body};
		}
	}

	new EchoRoute();
}

// Byte-exact payload: whitespace, key order, unicode and an escaped slash that JSON re-serialization would change.
const ExactJson = '{ "b":1,  "a":"caf\u00e9 \\/x" ,"n":1.50}\n';

describe('HttpServer - rawBody routes', () => {
	before(() => ensureBeLoggedTerminal());

	it('a rawBody route gets the untouched stream with the exact bytes', async () => {
		const server = createTestServer();
		await server.init();
		addRawRoute(server, '/raw');

		for (const contentType of ['application/json', 'text/plain', 'application/x-www-form-urlencoded']) {
			const res = await request(server.getExpress()).post('/raw').set('Content-Type', contentType).send(ExactJson).expect(200);
			expect(res.body.bodyUndefined, contentType).to.equal(true);
			expect(res.body.readable, contentType).to.equal(true);
			expect(Buffer.from(res.body.bytes, 'base64').toString('utf8'), contentType).to.equal(ExactJson);
		}
	});

	it('a rawBody route is not subject to the global parser limit', async () => {
		const server = createTestServer();
		await server.init();
		addRawRoute(server, '/raw-large');
		const large = JSON.stringify({x: 'y'.repeat(4096)});
		const res = await request(server.getExpress()).post('/raw-large').set('Content-Type', 'application/json').send(large).expect(200);
		expect(Buffer.from(res.body.bytes, 'base64').toString('utf8')).to.equal(large);
	});

	it('normal routes still parse JSON, text and form exactly as before', async () => {
		const server = createTestServer();
		await server.init();
		addEchoRoute(server, '/echo');

		const json = await request(server.getExpress()).post('/echo').set('Content-Type', 'application/json').send({x: 42}).expect(200);
		expect(json.body).to.deep.equal({body: {x: 42}, type: 'object'});

		const text = await request(server.getExpress()).post('/echo').set('Content-Type', 'text/plain').send('hello').expect(200);
		expect(text.body).to.deep.equal({body: 'hello', type: 'string'});

		const form = await request(server.getExpress()).post('/echo').set('Content-Type', 'application/x-www-form-urlencoded').send('a=1&b=two').expect(200);
		expect(form.body).to.deep.equal({body: {a: '1', b: 'two'}, type: 'object'});

		await request(server.getExpress()).post('/echo').set('Content-Type', 'application/json').send(JSON.stringify({x: 'y'.repeat(4096)})).expect(413);
	});

	it('a route without the flag is unaffected when another route has it', async () => {
		const server = createTestServer();
		await server.init();
		addRawRoute(server, '/hook');
		addEchoRoute(server, '/hook-sibling');
		addEchoRoute(server, '/hook/child');

		const raw = await request(server.getExpress()).post('/hook').set('Content-Type', 'application/json').send(ExactJson).expect(200);
		expect(raw.body.bodyUndefined).to.equal(true);

		for (const path of ['/hook-sibling', '/hook/child']) {
			const res = await request(server.getExpress()).post(path).set('Content-Type', 'application/json').send({x: 1}).expect(200);
			expect(res.body, path).to.deep.equal({body: {x: 1}, type: 'object'});
		}
	});

	it('the flag applies to the method it was registered with only', async () => {
		const server = createTestServer();
		await server.init();
		addRawRoute(server, '/same-path');

		class PutSamePath {
			@ApiHandler(() => ({method: 'put' as const, path: '/same-path'}), {httpServer: () => server})
			async put(body: unknown) {
				return {body};
			}
		}

		new PutSamePath();
		const res = await request(server.getExpress()).put('/same-path').set('Content-Type', 'application/json').send({x: 2}).expect(200);
		expect(res.body).to.deep.equal({body: {x: 2}});
	});

	it('honors the server path prefix', async () => {
		const server = new HttpServer({tag: 'test-prefix', port: 0, baseUrl: '', cors: {headers: [], responseHeaders: []}, bodyParserLimit: 1024, pathPrefix: '/api'} as never);
		await server.init();
		addRawRoute(server, 'webhook');
		addEchoRoute(server, '/echo');

		const raw = await request(server.getExpress()).post('/api/webhook').set('Content-Type', 'application/json').send(ExactJson).expect(200);
		expect(raw.body.bodyUndefined).to.equal(true);
		expect(Buffer.from(raw.body.bytes, 'base64').toString('utf8')).to.equal(ExactJson);

		const echo = await request(server.getExpress()).post('/api/echo').set('Content-Type', 'application/json').send({x: 3}).expect(200);
		expect(echo.body).to.deep.equal({body: {x: 3}, type: 'object'});
	});
});
