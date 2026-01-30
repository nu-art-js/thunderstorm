/*
 * @nu-art/http-server - Express HTTP server and typed ServerApi
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiHandler, _ServerQueryApi, _ServerBodyApi} from '../main/index.js';
import type {HttpServer} from '../main/index.js';
import {ensureBeLoggedTerminal} from './ensure-belogged.js';
import {expect} from 'chai';

const queryApiDef = {method: 'get' as const, path: '/test-query'};
const bodyApiDef = {method: 'post' as const, path: '/test-body'};

describe('ApiHandler initializer - route registration', () => {
	before(() => ensureBeLoggedTerminal());

	it('registers each decorated method on server when instance is created', () => {
		const added: unknown[] = [];
		const mockServer = {
			addRoute(api: unknown) {
				added.push(api);
			}
		};

		class C {
			@ApiHandler(() => queryApiDef, {server: () => mockServer as unknown as HttpServer})
			async get(_p: unknown) {
				return [];
			}

			@ApiHandler(() => bodyApiDef, {server: () => mockServer as unknown as HttpServer})
			async post(_b: unknown) {
				return {};
			}
		}
		new C();
		expect(added).to.have.length(2);
	});

	it('registers query API for GET and body API for POST', () => {
		const added: {api: unknown}[] = [];
		const mockServer = {
			addRoute(api: unknown) {
				added.push({api});
			}
		};

		class C {
			@ApiHandler(() => queryApiDef, {server: () => mockServer as unknown as HttpServer})
			async get(_p: unknown) {
				return [];
			}

			@ApiHandler(() => bodyApiDef, {server: () => mockServer as unknown as HttpServer})
			async post(_b: unknown) {
				return {};
			}
		}
		new C();
		expect(added).to.have.length(2);
		const queryApi = added.find(
			a => (a.api as { apiDef: { method: string } }).apiDef.method === 'get'
		)?.api;
		const bodyApi = added.find(
			a => (a.api as { apiDef: { method: string } }).apiDef.method === 'post'
		)?.api;
		expect(queryApi).to.be.instanceOf(_ServerQueryApi);
		expect(bodyApi).to.be.instanceOf(_ServerBodyApi);
	});

	it('resolves apiDef from resolver with instance', () => {
		const added: {api: unknown}[] = [];
		const mockServer = {
			addRoute(api: unknown) {
				added.push({api});
			}
		};

		const dynamicPath = '/dynamic-path';
		class C {
			getApiDef() {
				return {method: 'get' as const, path: dynamicPath};
			}

			@ApiHandler((m: C) => m.getApiDef(), {server: () => mockServer as unknown as HttpServer})
			async get(_p: unknown) {
				return [];
			}
		}
		new C();
		expect(added).to.have.length(1);
		const api = added[0].api as { apiDef: { path: string } };
		expect(api.apiDef.path).to.equal(dynamicPath);
	});
});
