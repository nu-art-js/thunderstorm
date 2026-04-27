/*
 * @nu-art/http-e2e-tests - E2E tests for HTTP client and server
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiException} from '@nu-art/ts-common';
import {ApiDef, HttpException} from '@nu-art/http-client';
import {ApiProxy, E2EPort, killProcessOnPort, queryRoute, withServer} from './e2e-server.js';
import {ensureBeLoggedTerminal} from './ensure-belogged.js';
import {expect} from 'chai';

describe('E2E client-server errors', () => {
	before(() => ensureBeLoggedTerminal());
	beforeEach(() => killProcessOnPort(E2EPort));

	it('Server returns 400 - client gets HttpException with responseCode 400', async () => {
		const apiDef: ApiDef<any> = {method: 'get', path: '/err400'};
		await withServer(
			server => queryRoute(server, apiDef, async () => { throw new ApiException(400, 'bad request'); }),
			async client => {
				try {
					await new ApiProxy(apiDef, client).call({});
					expect.fail('expected HttpException');
				} catch (e) {
					expect(e).to.be.instanceOf(HttpException);
					expect((e as HttpException).responseCode).to.equal(400);
				}
			}
		);
	});

	it('Server returns 404 - client gets HttpException with 404', async () => {
		const pingDef: ApiDef<any> = {method: 'get', path: '/ping'};
		const wrongDef: ApiDef<any> = {method: 'get', path: '/nonexistent'};
		await withServer(
			server => queryRoute(server, pingDef, async () => ({ok: true})),
			async client => {
				try {
					await new ApiProxy(wrongDef, client).call({});
					expect.fail('expected HttpException');
				} catch (e) {
					expect(e).to.be.instanceOf(HttpException);
					expect((e as HttpException).responseCode).to.equal(404);
				}
			}
		);
	});

	it('Server returns 401 - client gets 401 and error body', async () => {
		const apiDef: ApiDef<any> = {method: 'get', path: '/err401'};
		await withServer(
			server => queryRoute(server, apiDef, async () => { throw new ApiException(401, 'unauthorized'); }),
			async client => {
				try {
					await new ApiProxy(apiDef, client).call({});
					expect.fail('expected HttpException');
				} catch (e) {
					expect(e).to.be.instanceOf(HttpException);
					expect((e as HttpException).responseCode).to.equal(401);
				}
			}
		);
	});

	it('Server returns 403 - client gets 403 and error body', async () => {
		const apiDef: ApiDef<any> = {method: 'get', path: '/err403'};
		await withServer(
			server => queryRoute(server, apiDef, async () => { throw new ApiException(403, 'forbidden'); }),
			async client => {
				try {
					await new ApiProxy(apiDef, client).call({});
					expect.fail('expected HttpException');
				} catch (e) {
					expect(e).to.be.instanceOf(HttpException);
					expect((e as HttpException).responseCode).to.equal(403);
				}
			}
		);
	});

	it('Server returns 500 - client gets HttpException with 500', async () => {
		const apiDef: ApiDef<any> = {method: 'get', path: '/err500'};
		await withServer(
			server => queryRoute(server, apiDef, async () => { throw new Error('server error'); }),
			async client => {
				try {
					await new ApiProxy(apiDef, client).call({});
					expect.fail('expected HttpException');
				} catch (e) {
					expect(e).to.be.instanceOf(HttpException);
					expect((e as HttpException).responseCode).to.equal(500);
				}
			}
		);
	});
});
