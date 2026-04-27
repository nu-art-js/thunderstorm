/*
 * @nu-art/http-e2e-tests - E2E tests for HTTP client and server
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {MemKey_HttpResponse} from '@nu-art/http-server';
import {ApiDef} from '@nu-art/http-client';
import {ApiProxy, bodyRoute, E2EPort, killProcessOnPort, queryRoute, withServer} from './e2e-server.js';
import {ensureBeLoggedTerminal} from './ensure-belogged.js';
import {expect} from 'chai';

describe('E2E client-server contract', () => {
	before(() => ensureBeLoggedTerminal());
	beforeEach(() => killProcessOnPort(E2EPort));

	it('GET with single query param returns 200 and body matches param', async () => {
		const apiDef: ApiDef<any> = {method: 'get', path: '/echo-one'};
		await withServer(
			server => queryRoute(server, apiDef, async ({a}: {a?: string}) => ({a: a ?? ''})),
			async client => {
				const res = await new ApiProxy(apiDef, client).call({a: 'x'});
				expect(res).to.deep.equal({a: 'x'});
			}
		);
	});

	it('GET with multiple query params returns 200 and body equals params', async () => {
		const apiDef: ApiDef<any> = {method: 'get', path: '/echo-query'};
		await withServer(
			server => queryRoute(server, apiDef, async (params: Record<string, string>) => params ?? {}),
			async client => {
				const res = await new ApiProxy(apiDef, client).call({a: '1', b: '2'});
				expect(res).to.deep.equal({a: '1', b: '2'});
			}
		);
	});

	it('GET with no query params returns 200 with predictable body', async () => {
		const apiDef: ApiDef<any> = {method: 'get', path: '/ping'};
		await withServer(
			server => queryRoute(server, apiDef, async () => ({ok: true})),
			async client => {
				const res = await new ApiProxy(apiDef, client).call({});
				expect(res).to.deep.equal({ok: true});
			}
		);
	});

	it('DELETE with query params returns 200 and body echoes params', async () => {
		const apiDef: ApiDef<any> = {method: 'delete', path: '/echo-delete'};
		await withServer(
			server => queryRoute(server, apiDef, async (params: Record<string, string>) => params ?? {}),
			async client => {
				const res = await new ApiProxy(apiDef, client).call({id: '123'});
				expect(res).to.deep.equal({id: '123'});
			}
		);
	});

	it('POST with JSON body returns 200 and body echoes request body', async () => {
		const apiDef: ApiDef<any> = {method: 'post', path: '/echo-body'};
		await withServer(
			server => bodyRoute(server, apiDef, async (body: {x: number}) => body),
			async client => {
				const res = await new ApiProxy(apiDef, client).call({x: 42});
				expect(res).to.deep.equal({x: 42});
			}
		);
	});

	it('POST with empty JSON body returns 200 and server handles gracefully', async () => {
		const apiDef: ApiDef<any> = {method: 'post', path: '/echo-empty'};
		await withServer(
			server => bodyRoute(server, apiDef, async (body: Record<string, unknown>) => ({received: body ?? {}})),
			async client => {
				const res = await new ApiProxy(apiDef, client).call({});
				expect(res).to.have.property('received');
			}
		);
	});

	it('PUT with JSON body returns 200 and body echoes', async () => {
		const apiDef: ApiDef<any> = {method: 'put', path: '/echo-put'};
		await withServer(
			server => bodyRoute(server, apiDef, async (body: {key: string}) => body),
			async client => {
				const res = await new ApiProxy(apiDef, client).call({key: 'value'});
				expect(res).to.deep.equal({key: 'value'});
			}
		);
	});

	it('GET returning 204 No Content - client receives 204 via callback statusCode', async () => {
		const apiDef: ApiDef<any> = {method: 'get', path: '/empty'};
		await withServer(
			server => queryRoute(server, apiDef, async () => { MemKey_HttpResponse.get().code(204); }),
			async client => {
				let statusCode = 0;
				await new ApiProxy(apiDef, client).call({}, ctx => { statusCode = ctx.statusCode; });
				expect(statusCode).to.equal(204);
			}
		);
	});
});
