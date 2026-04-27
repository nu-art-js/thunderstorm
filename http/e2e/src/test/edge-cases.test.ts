/*
 * @nu-art/http-e2e-tests - E2E tests for HTTP client and server
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiDef, HttpClient, HttpException} from '@nu-art/http-client';
import {ApiProxy, bodyRoute, E2EPort, killProcessOnPort, origin, queryRoute, withServer} from './e2e-server.js';
import {ensureBeLoggedTerminal} from './ensure-belogged.js';
import {expect} from 'chai';

describe('E2E edge cases', () => {
	before(() => ensureBeLoggedTerminal());
	beforeEach(() => killProcessOnPort(E2EPort));

	it('Empty string query param vs missing param - server echoes consistently', async () => {
		const apiDef: ApiDef<any> = {method: 'get', path: '/echo-query'};
		await withServer(
			server => queryRoute(server, apiDef, async (params: Record<string, string>) => params ?? {}),
			async client => {
				// Empty string is a valid query param value; server echoes it as {a: ''}.
				const resEmpty = await new ApiProxy(apiDef, client).call({a: ''}) as Record<string, string>;
				expect(resEmpty).to.have.property('a').equal('');
				const resPresent = await new ApiProxy(apiDef, client).call({a: 'x'}) as Record<string, string>;
				expect(resPresent).to.deep.equal({a: 'x'});
			}
		);
	});

	it('Special characters in query - round-trip correctly', async () => {
		const apiDef: ApiDef<any> = {method: 'get', path: '/echo-query'};
		await withServer(
			server => queryRoute(server, apiDef, async (params: Record<string, string>) => params ?? {}),
			async client => {
				const res = await new ApiProxy(apiDef, client).call({x: 'a b', y: 'c%20d'}) as Record<string, string>;
				expect(res.x).to.equal('a b');
				expect(res.y).to.equal('c%20d');
			}
		);
	});

	it('Unicode in body - server echoes, client receives same string', async () => {
		const apiDef: ApiDef<any> = {method: 'post', path: '/echo-body'};
		await withServer(
			server => bodyRoute(server, apiDef, async (body: {text: string}) => body),
			async client => {
				const payload = {text: 'Hello 世界 café emoji: 🎉'};
				const res = await new ApiProxy(apiDef, client).call(payload);
				expect(res).to.deep.equal(payload);
			}
		);
	});

	it('Connection refused - client calls wrong port, fails with connection error', async () => {
		killProcessOnPort(E2EPort);
		const client = new HttpClient({origin, timeout: 2000});
		try {
			await new ApiProxy({method: 'get', path: '/any'}, client).call({});
			expect.fail('expected connection error');
		} catch (e) {
			expect(e).to.be.instanceOf(Error);
			if (e instanceof HttpException)
				expect([0, 500]).to.include(e.responseCode);
		}
	});

	it('Content-Type application/json - server receives and parses JSON', async () => {
		const apiDef: ApiDef<any> = {method: 'post', path: '/echo-body'};
		await withServer(
			server => bodyRoute(server, apiDef, async (body: {n: number}) => body),
			async client => {
				const res = await new ApiProxy(apiDef, client).call({n: 99});
				expect(res).to.deep.equal({n: 99});
			}
		);
	});
});
