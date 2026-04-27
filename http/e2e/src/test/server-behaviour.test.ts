/*
 * @nu-art/http-e2e-tests - E2E tests for HTTP client and server
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Readable} from 'stream';
import {MemKey_HttpResponse} from '@nu-art/http-server';
import {ApiDef, HttpException} from '@nu-art/http-client';
import {ApiProxy, E2EPort, killProcessOnPort, queryRoute, withServer} from './e2e-server.js';
import {ensureBeLoggedTerminal} from './ensure-belogged.js';
import {expect} from 'chai';

describe('E2E server behaviour', () => {
	before(() => ensureBeLoggedTerminal());
	beforeEach(() => killProcessOnPort(E2EPort));

	it('Redirect - server responds with 302 and Location, client receives 302 and header', async () => {
		const redirectDef: ApiDef<any> = {method: 'get', path: '/redirect'};
		const targetDef: ApiDef<any> = {method: 'get', path: '/target'};
		await withServer(
			server => {
				queryRoute(server, redirectDef, async () => { MemKey_HttpResponse.get().redirect(302, '/target'); });
				queryRoute(server, targetDef, async () => ({ok: true}));
			},
			async client => {
				client.setRequestOption({maxRedirects: 0});
				try {
					await new ApiProxy(redirectDef, client).call({});
					expect.fail('expected 302');
				} catch (e) {
					expect(e).to.be.instanceOf(HttpException);
					expect((e as HttpException).responseCode).to.equal(302);
					expect((e as HttpException).request.getResponseHeader('location')).to.equal('/target');
				}
			}
		);
	});

	it('Custom response headers - client receives header via ApiCallContext', async () => {
		const apiDef: ApiDef<any> = {method: 'get', path: '/res-header'};
		await withServer(
			server => queryRoute(server, apiDef, async () => {
				MemKey_HttpResponse.get().setHeader('X-Response-Header', 'response-value');
				return {ok: true};
			}),
			async client => {
				let capturedHeaders: Record<string, any> = {};
				await new ApiProxy(apiDef, client).call({}, ctx => { capturedHeaders = ctx.headers; });
				expect(capturedHeaders['x-response-header']).to.equal('response-value');
			}
		);
	});

	it('Streaming response - client receives full body', async () => {
		const apiDef: ApiDef<any> = {method: 'get', path: '/stream'};
		await withServer(
			server => queryRoute(server, apiDef, async () => {
				const s = new Readable({read() {}});
				s.push('chunk1');
				s.push('chunk2');
				s.push(null);
				MemKey_HttpResponse.get().stream(200, s);
			}),
			async client => {
				const res = await new ApiProxy(apiDef, client).call({});
				expect(res).to.equal('chunk1chunk2');
			}
		);
	});

	it('Large body - server returns larger JSON payload, client receives full body', async () => {
		const apiDef: ApiDef<any> = {method: 'get', path: '/large'};
		await withServer(
			server => queryRoute(server, apiDef, async () => ({
				items: Array.from({length: 500}, (_, i) => ({id: i, name: `item-${i}`}))
			})),
			async client => {
				const res = await new ApiProxy(apiDef, client).call({}) as {items: {id: number; name: string}[]};
				expect(res.items).to.have.length(500);
				expect(res.items[0]).to.deep.equal({id: 0, name: 'item-0'});
				expect(res.items[499]).to.deep.equal({id: 499, name: 'item-499'});
			}
		);
	});

	it('Empty 200 body - server returns 200 with empty object, client parses without error', async () => {
		const apiDef: ApiDef<any> = {method: 'get', path: '/empty-json'};
		await withServer(
			server => queryRoute(server, apiDef, async () => ({})),
			async client => {
				const res = await new ApiProxy(apiDef, client).call({});
				expect(res).to.deep.equal({});
			}
		);
	});
});
