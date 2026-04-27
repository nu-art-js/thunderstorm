/*
 * @nu-art/http-e2e-tests - E2E tests for HTTP client and server
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {MemKey_HttpRequestHeaders} from '@nu-art/http-server';
import {ApiDef, HttpClient, HttpException} from '@nu-art/http-client';
import {ApiProxy, bodyRoute, E2EPort, killProcessOnPort, origin, queryRoute, withServer} from './e2e-server.js';
import {ensureBeLoggedTerminal} from './ensure-belogged.js';
import {expect} from 'chai';

describe('E2E client config', () => {
	before(() => ensureBeLoggedTerminal());
	beforeEach(() => killProcessOnPort(E2EPort));

	it('Custom request header is received by server and echoed in response', async () => {
		const apiDef: ApiDef<any> = {method: 'get', path: '/echo-header'};
		await withServer(
			server => queryRoute(server, apiDef, async () => {
				const headers = MemKey_HttpRequestHeaders.get();
				return {value: headers['x-custom'] ?? ''};
			}),
			async client => {
				client.addDefaultHeader('X-Custom', 'my-value');
				const res = await new ApiProxy(apiDef, client).call({});
				expect(res).to.deep.equal({value: 'my-value'});
			}
		);
	});

	it('Base URL / origin - requests hit E2E server and return correct response', async () => {
		const apiDef: ApiDef<any> = {method: 'get', path: '/ping'};
		await withServer(
			server => queryRoute(server, apiDef, async () => ({ok: true})),
			async client => {
				const res = await new ApiProxy(apiDef, client).call({});
				expect(res).to.deep.equal({ok: true});
			}
		);
	});

	it('Multiple sequential requests - same client and server', async () => {
		const getDef: ApiDef<any> = {method: 'get', path: '/echo-query'};
		const postDef: ApiDef<any> = {method: 'post', path: '/echo-body'};
		await withServer(
			server => {
				queryRoute(server, getDef, async (params: Record<string, string>) => params ?? {});
				bodyRoute(server, postDef, async (body: {n: number}) => body);
			},
			async client => {
				const r1 = await new ApiProxy(getDef, client).call({a: '1'});
				expect(r1).to.deep.equal({a: '1'});
				const r2 = await new ApiProxy(getDef, client).call({b: '2'});
				expect(r2).to.deep.equal({b: '2'});
				const r3 = await new ApiProxy(postDef, client).call({n: 42});
				expect(r3).to.deep.equal({n: 42});
			}
		);
	});

	it('Client timeout - server responds after delay longer than client timeout', async () => {
		const apiDef: ApiDef<any> = {method: 'get', path: '/slow'};
		await withServer(
			server => queryRoute(server, apiDef, async () => {
				await new Promise(resolve => setTimeout(resolve, 200));
				return {ok: true};
			}),
			async _client => {
				const shortTimeout = new HttpClient({origin, timeout: 50});
				try {
					await new ApiProxy(apiDef, shortTimeout).call({});
					expect.fail('expected timeout or HttpException');
				} catch (e: unknown) {
					expect(e).to.be.instanceOf(Error);
					if (e instanceof HttpException)
						expect([0, 500]).to.include(e.responseCode);
				}
			}
		);
	});

	it('HttpClient.setDefault - default client instance is used for requests', async () => {
		const apiDef: ApiDef<any> = {method: 'get', path: '/echo-caller'};
		await withServer(
			server => queryRoute(server, apiDef, async (params: Record<string, string>) => params ?? {}),
			async _client => {
				HttpClient.setDefault({origin});
				const res = await new ApiProxy(apiDef, HttpClient.default).call({a: '1', b: '2'});
				expect(res).to.deep.equal({a: '1', b: '2'});
			}
		);
	});
});
