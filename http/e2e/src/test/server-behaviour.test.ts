/*
 * @nu-art/http-e2e-tests - E2E tests for HTTP client and server
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Readable} from 'stream';
import {ApiHandler, MemKey_HttpResponse} from '@nu-art/http-server';
import {HttpClient, HttpException} from '@nu-art/http-client';
import {createE2EServer, E2EPort, killProcessOnPort} from './e2e-server.js';
import {ensureBeLoggedTerminal} from './ensure-belogged.js';
import {expect} from 'chai';

const origin = `http://127.0.0.1:${E2EPort}`;

describe('E2E server behaviour', () => {
	before(() => ensureBeLoggedTerminal());
	beforeEach(() => killProcessOnPort(E2EPort));

	it('Redirect - server responds with 302 and Location, client receives 302 and header', async () => {
		const server = createE2EServer();
		await server.init();
		const redirectDef = {method: 'get' as const, path: '/redirect'};
		const targetDef = {method: 'get' as const, path: '/target'};
		class RedirectApi {
			@ApiHandler(() => redirectDef, {httpServer: () => server})
			async get(_params: unknown) {
				MemKey_HttpResponse.get().redirect(302, '/target');
			}
		}
		class TargetApi {
			@ApiHandler(() => targetDef, {httpServer: () => server})
			async get(_params: unknown) {
				return {ok: true};
			}
		}
		new RedirectApi();
		new TargetApi();
		await server.startServer();

		const client = new HttpClient({origin});
		const req = client.createRequest(redirectDef).setUrlParams({}).setRequestOption({maxRedirects: 0});
		try {
			await req.execute();
			expect.fail('expected 302');
		} catch (e) {
			expect(e).to.be.instanceOf(HttpException);
			expect((e as HttpException).responseCode).to.equal(302);
			expect((e as HttpException).request.getResponseHeader('location')).to.equal('/target');
		}
		await server.terminate();
	});

	it('Custom response headers - client response includes header', async () => {
		const server = createE2EServer();
		await server.init();
		const apiDef = {method: 'get' as const, path: '/res-header'};
		class ResHeaderApi {
			@ApiHandler(() => apiDef, {httpServer: () => server})
			async get(_params: unknown) {
				MemKey_HttpResponse.get().setHeader('X-Response-Header', 'response-value');
				return {ok: true};
			}
		}
		new ResHeaderApi();
		await server.startServer();

		const client = new HttpClient({origin});
		const req = client.createRequest(apiDef).setUrlParams({});
		await req.execute();
		expect(req.getResponseHeader('x-response-header')).to.equal('response-value');
		await server.terminate();
	});

	it('Streaming response - client receives full body', async () => {
		const server = createE2EServer();
		await server.init();
		const apiDef = {method: 'get' as const, path: '/stream'};
		class StreamApi {
			@ApiHandler(() => apiDef, {httpServer: () => server})
			async get(_params: unknown) {
				const s = new Readable({read() {}});
				s.push('chunk1');
				s.push('chunk2');
				s.push(null);
				MemKey_HttpResponse.get().stream(200, s);
			}
		}
		new StreamApi();
		await server.startServer();

		const client = new HttpClient({origin});
		const req = client.createRequest(apiDef).setUrlParams({});
		const res = await req.execute();
		expect(res).to.equal('chunk1chunk2');
		await server.terminate();
	});

	it('Large body - server returns larger JSON payload, client receives full body', async () => {
		const server = createE2EServer();
		await server.init();
		const apiDef = {method: 'get' as const, path: '/large'};
		class LargeApi {
			@ApiHandler(() => apiDef, {httpServer: () => server})
			async get(_params: unknown) {
				return {items: Array.from({length: 500}, (_, i) => ({id: i, name: `item-${i}`}))};
			}
		}
		new LargeApi();
		await server.startServer();

		const client = new HttpClient({origin});
		const res = await client.createRequest(apiDef).setUrlParams({}).execute() as { items: { id: number; name: string }[] };
		expect(res.items).to.have.length(500);
		expect(res.items[0]).to.deep.equal({id: 0, name: 'item-0'});
		expect(res.items[499]).to.deep.equal({id: 499, name: 'item-499'});
		await server.terminate();
	});

	it('Empty 200 body - server returns 200 with empty object, client parses without error', async () => {
		const server = createE2EServer();
		await server.init();
		const apiDef = {method: 'get' as const, path: '/empty-json'};
		class EmptyJsonApi {
			@ApiHandler(() => apiDef, {httpServer: () => server})
			async get(_params: unknown) {
				return {};
			}
		}
		new EmptyJsonApi();
		await server.startServer();

		const client = new HttpClient({origin});
		const res = await client.createRequest(apiDef).setUrlParams({}).execute();
		expect(res).to.deep.equal({});
		await server.terminate();
	});
});
