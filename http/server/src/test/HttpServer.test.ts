/*
 * @nu-art/http-server - Express HTTP server and typed ServerApi
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {HttpServer, _ServerQueryApi} from '../main/index.js';
import {ensureBeLoggedTerminal} from './ensure-belogged.js';
import {expect} from 'chai';

const apiDef = {method: 'get' as const, path: '/same-path'};

describe('HttpServer - addRoute', () => {
	before(() => ensureBeLoggedTerminal());

	it('addRoute registers route and calls api.route with express, pathPrefix, baseUrl', () => {
		const server = new HttpServer({
			tag: 'test',
			baseUrl: '/api',
			cors: {headers: [], responseHeaders: []},
		});
		const api = new _ServerQueryApi(apiDef, async () => ({}));
		let routeCalled = false;
		let routeArgs: unknown[] = [];
		(api as { route: (a: unknown, b: string, c: string) => void }).route = (router: unknown, prefix: string, base: string) => {
			routeCalled = true;
			routeArgs = [router, prefix, base];
		};
		server.addRoute(api);
		expect(routeCalled).to.equal(true);
		expect(routeArgs[1]).to.equal('');
		expect(routeArgs[2]).to.equal('/api');
	});

	it('addRoute throws when same path is registered twice', () => {
		const server = new HttpServer({
			tag: 'test',
			baseUrl: '',
			cors: {headers: [], responseHeaders: []},
		});
		const api1 = new _ServerQueryApi(apiDef, async () => ({}));
		const api2 = new _ServerQueryApi(apiDef, async () => ({}));
		server.addRoute(api1);
		expect(() => server.addRoute(api2)).to.throw(Error, /Duplicate API path: \/same-path/);
	});
});
