/*
 * @nu-art/http-server - Express HTTP server and typed ServerApi
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Readable} from 'stream';
import request from 'supertest';
import {ApiException} from '@nu-art/ts-common';
import {ApiHandler, MemKey_HttpRequest, MemKey_HttpRequestHeaders, MemKey_HttpResponse} from '../../main/index.js';
import {ensureBeLoggedTerminal} from '../ensure-belogged.js';
import {createTestServer} from './test-server.js';
import {expect} from 'chai';

describe('ServerApi - Supertest permutations', () => {
	before(() => ensureBeLoggedTerminal());

	describe('Method + input', () => {
		it('GET with query params echoes params in response', async () => {
			const server = createTestServer();
			await server.init();
			const apiDef = {method: 'get' as const, path: '/echo-query'};
			class EchoQuery {
				@ApiHandler(() => apiDef, {httpServer: () => server})
				async get(params: Record<string, string>) {
					return params ?? {};
				}
			}
			new EchoQuery();

			const res = await request(server.getExpress())
				.get('/echo-query')
				.query({a: '1', b: '2'})
				.expect(200)
				.expect('Content-Type', /json/);
			expect(res.body).to.deep.equal({a: '1', b: '2'});
		});

		it('DELETE with query params echoes params in response', async () => {
			const server = createTestServer();
			await server.init();
			const apiDef = {method: 'delete' as const, path: '/echo-query-delete'};
			class EchoQueryDelete {
				@ApiHandler(() => apiDef, {httpServer: () => server})
				async delete(params: Record<string, string>) {
					return params ?? {};
				}
			}
			new EchoQueryDelete();

			const res = await request(server.getExpress())
				.delete('/echo-query-delete')
				.query({id: '123'})
				.expect(200)
				.expect('Content-Type', /json/);
			expect(res.body).to.deep.equal({id: '123'});
		});

		it('POST with JSON body echoes body in response', async () => {
			const server = createTestServer();
			await server.init();
			const apiDef = {method: 'post' as const, path: '/echo-body'};
			class EchoBody {
				@ApiHandler(() => apiDef, {httpServer: () => server})
				async post(body: { x: number }) {
					return body;
				}
			}
			new EchoBody();

			const res = await request(server.getExpress())
				.post('/echo-body')
				.set('Content-Type', 'application/json')
				.send({x: 42})
				.expect(200)
				.expect('Content-Type', /json/);
			expect(res.body).to.deep.equal({x: 42});
		});

		it('PUT with JSON body echoes body in response', async () => {
			const server = createTestServer();
			await server.init();
			const apiDef = {method: 'put' as const, path: '/echo-put'};
			class EchoPut {
				@ApiHandler(() => apiDef, {httpServer: () => server})
				async put(body: { key: string }) {
					return body;
				}
			}
			new EchoPut();

			const res = await request(server.getExpress())
				.put('/echo-put')
				.set('Content-Type', 'application/json')
				.send({key: 'value'})
				.expect(200)
				.expect('Content-Type', /json/);
			expect(res.body).to.deep.equal({key: 'value'});
		});

		it('POST with text body returns body in response', async () => {
			const server = createTestServer();
			await server.init();
			const apiDef = {method: 'post' as const, path: '/echo-text-body'};
			class EchoTextBody {
				@ApiHandler(() => apiDef, {httpServer: () => server})
				async post(body: unknown) {
					return {raw: typeof body === 'string' ? body : ''};
				}
			}
			new EchoTextBody();

			const res = await request(server.getExpress())
				.post('/echo-text-body')
				.set('Content-Type', 'text/plain')
				.send('plain text payload')
				.expect(200)
				.expect('Content-Type', /json/);
			expect(res.body.raw).to.equal('plain text payload');
		});

		it('PATCH with empty body returns ok', async () => {
			const server = createTestServer();
			await server.init();
			const apiDef = {method: 'patch' as const, path: '/patch-empty'};
			class PatchEmpty {
				@ApiHandler(() => apiDef, {httpServer: () => server})
				async patch(body: unknown) {
					const empty = body == null || body === '' ||
						(typeof body === 'object' && Object.keys(body as object).length === 0);
					return {received: body, empty};
				}
			}
			new PatchEmpty();

			const res = await request(server.getExpress())
				.patch('/patch-empty')
				.expect(200)
				.expect('Content-Type', /json/);
			expect(res.body.empty).to.equal(true);
		});
	});

	describe('Response type', () => {
		it('JSON out: handler returns object', async () => {
			const server = createTestServer();
			await server.init();
			const apiDef = {method: 'get' as const, path: '/json'};
			class JsonApi {
				@ApiHandler(() => apiDef, {httpServer: () => server})
				async get(_params: unknown) {
					return {ok: true};
				}
			}
			new JsonApi();

			await request(server.getExpress())
				.get('/json')
				.expect(200)
				.expect('Content-Type', /json/)
				.expect(res => expect(res.body).to.deep.equal({ok: true}));
		});

		it('Text out: handler returns string', async () => {
			const server = createTestServer();
			await server.init();
			const apiDef = {method: 'get' as const, path: '/text'};
			class TextApi {
				@ApiHandler(() => apiDef, {httpServer: () => server})
				async get(_params: unknown) {
					return 'hello';
				}
			}
			new TextApi();

			const res = await request(server.getExpress()).get('/text').expect(200).expect('Content-Type', /text\/plain/);
			expect(res.text).to.equal('hello');
		});

		it('HTML out: handler returns string starting with <html', async () => {
			const server = createTestServer();
			await server.init();
			const apiDef = {method: 'get' as const, path: '/html'};
			class HtmlApi {
				@ApiHandler(() => apiDef, {httpServer: () => server})
				async get(_params: unknown) {
					return '<html><body>hi</body></html>';
				}
			}
			new HtmlApi();

			const res = await request(server.getExpress()).get('/html').expect(200).expect('Content-Type', /text\/html/);
			expect(res.text).to.include('<html>');
		});

		it('Empty: handler uses response.code(204)', async () => {
			const server = createTestServer();
			await server.init();
			const apiDef = {method: 'get' as const, path: '/empty'};
			class EmptyApi {
				@ApiHandler(() => apiDef, {httpServer: () => server})
				async get(_params: unknown) {
					MemKey_HttpResponse.get().code(204);
				}
			}
			new EmptyApi();

			const res = await request(server.getExpress()).get('/empty').expect(204);
			expect(res.body).to.deep.equal({});
			expect(res.text).to.equal('');
		});

		it('Redirect: handler uses response.redirect(302, url)', async () => {
			const server = createTestServer();
			await server.init();
			const apiDef = {method: 'get' as const, path: '/redirect'};
			class RedirectApi {
				@ApiHandler(() => apiDef, {httpServer: () => server})
				async get(_params: unknown) {
					MemKey_HttpResponse.get().redirect(302, '/target');
				}
			}
			new RedirectApi();

			const res = await request(server.getExpress()).get('/redirect').expect(302);
			expect(res.headers.location).to.equal('/target');
		});

		it('Stream out: handler uses response.stream(200, stream)', async () => {
			const server = createTestServer();
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

			const res = await request(server.getExpress()).get('/stream').expect(200);
			expect(res.text).to.equal('chunk1chunk2');
		});
	});

	describe('Headers', () => {
		it('Request header echoed in response body', async () => {
			const server = createTestServer();
			await server.init();
			const apiDef = {method: 'get' as const, path: '/echo-header'};
			class EchoHeader {
				@ApiHandler(() => apiDef, {httpServer: () => server})
				async get(_params: unknown) {
					const headers = MemKey_HttpRequestHeaders.get();
					return {value: headers['x-custom'] ?? ''};
				}
			}
			new EchoHeader();

			const res = await request(server.getExpress())
				.get('/echo-header')
				.set('X-Custom', 'my-value')
				.expect(200)
				.expect('Content-Type', /json/);
			expect(res.body.value).to.equal('my-value');
		});

		it('Response header set before body', async () => {
			const server = createTestServer();
			await server.init();
			const apiDef = {method: 'get' as const, path: '/res-header'};
			class ResHeaderApi {
				@ApiHandler(() => apiDef, {httpServer: () => server})
				async get(_params: unknown) {
					MemKey_HttpResponse.get().setHeader('X-Custom', 'response-value');
					return {ok: true};
				}
			}
			new ResHeaderApi();

			const res = await request(server.getExpress()).get('/res-header').expect(200);
			expect(res.headers['x-custom']).to.equal('response-value');
			expect(res.body).to.deep.equal({ok: true});
		});
	});

	describe('Errors', () => {
		it('4xx: handler throws ApiException(400)', async () => {
			const server = createTestServer();
			await server.init();
			const apiDef = {method: 'get' as const, path: '/err400'};
			class Err400Api {
				@ApiHandler(() => apiDef, {httpServer: () => server})
				async get(_params: unknown) {
					throw new ApiException(400, 'bad request');
				}
			}
			new Err400Api();

			const res = await request(server.getExpress()).get('/err400').expect(400).expect('Content-Type', /json/);
			expect(res.status).to.equal(400);
			expect(res.body).to.be.an('object');
			if (typeof res.body.debugMessage === 'string')
				expect(res.body.debugMessage).to.include('bad request');
		});

		it('5xx: handler throws generic Error', async () => {
			const server = createTestServer();
			await server.init();
			const apiDef = {method: 'get' as const, path: '/err500'};
			class Err500Api {
				@ApiHandler(() => apiDef, {httpServer: () => server})
				async get(_params: unknown) {
					throw new Error('server error');
				}
			}
			new Err500Api();

			const res = await request(server.getExpress()).get('/err500').expect(500);
			expect(res.text).to.include('server error');
		});
	});

	describe('Middleware', () => {
		it('Route middleware runs and sets header', async () => {
			const server = createTestServer();
			await server.init();
			const apiDef = {method: 'get' as const, path: '/middleware'};
			class MiddlewareApi {
				@ApiHandler(() => apiDef, {
					httpServer: () => server,
					middlewares: [
						async () => {
							MemKey_HttpResponse.get().setHeader('X-Middleware', 'ran');
						},
					],
				})
				async get(_params: unknown) {
					return {ok: true};
				}
			}
			new MiddlewareApi();

			const res = await request(server.getExpress()).get('/middleware').expect(200);
			expect(res.headers['x-middleware']).to.equal('ran');
			expect(res.body).to.deep.equal({ok: true});
		});

		it('Multiple route middlewares run in order and both set headers', async () => {
			const server = createTestServer();
			await server.init();
			const apiDef = {method: 'get' as const, path: '/multi-mw'};
			class MultiMiddlewareApi {
				@ApiHandler(() => apiDef, {
					httpServer: () => server,
					middlewares: [
						async () => {
							MemKey_HttpResponse.get().setHeader('X-First', '1');
						},
						async () => {
							MemKey_HttpResponse.get().setHeader('X-Second', '2');
						},
					],
				})
				async get(_params: unknown) {
					return {ok: true};
				}
			}
			new MultiMiddlewareApi();

			const res = await request(server.getExpress()).get('/multi-mw').expect(200);
			expect(res.headers['x-first']).to.equal('1');
			expect(res.headers['x-second']).to.equal('2');
			expect(res.body).to.deep.equal({ok: true});
		});

		it('Route middleware can short-circuit with 403 without calling handler body', async () => {
			const server = createTestServer();
			await server.init();
			const apiDef = {method: 'get' as const, path: '/forbidden'};
			class ForbiddenApi {
				@ApiHandler(() => apiDef, {
					httpServer: () => server,
					middlewares: [
						async () => {
							MemKey_HttpResponse.get().code(403);
						},
					],
				})
				async get(_params: unknown) {
					return {shouldNotAppear: true};
				}
			}
			new ForbiddenApi();

			const res = await request(server.getExpress()).get('/forbidden').expect(403);
			expect(res.body).to.deep.equal({});
			expect(res.text).to.equal('');
		});
	});

	describe('Server-level middleware', () => {
		it('Instance addMiddleware runs for every request and sets header', async () => {
			const server = createTestServer();
			server.addMiddleware((_req, res, next) => {
				res.setHeader('X-Server-Mw', 'global');
				next();
			});
			await server.init();
			const apiDef = {method: 'get' as const, path: '/any'};
			class AnyApi {
				@ApiHandler(() => apiDef, {httpServer: () => server})
				async get(_params: unknown) {
					return {ok: true};
				}
			}
			new AnyApi();

			const res = await request(server.getExpress()).get('/any').expect(200);
			expect(res.headers['x-server-mw']).to.equal('global');
			expect(res.body).to.deep.equal({ok: true});
		});

		it('Instance middleware runs before route handler (order)', async () => {
			const server = createTestServer();
			server.addMiddleware((req, _res, next) => {
				(req as { _serverMwRan?: boolean })._serverMwRan = true;
				next();
			});
			await server.init();
			const apiDef = {method: 'get' as const, path: '/order'};
			class OrderApi {
				@ApiHandler(() => apiDef, {
					httpServer: () => server,
					middlewares: [
						async () => {
							const req = MemKey_HttpRequest.get();
							MemKey_HttpResponse.get().setHeader('X-Request-Id', (req as { _serverMwRan?: boolean })._serverMwRan ? 'after-server' : 'none');
						},
					],
				})
				async get(_params: unknown) {
					return {ok: true};
				}
			}
			new OrderApi();

			const res = await request(server.getExpress()).get('/order').expect(200);
			expect(res.headers['x-request-id']).to.equal('after-server');
		});
	});

	describe('Multiple APIs', () => {
		it('One server with multiple routes responds correctly to each', async () => {
			const server = createTestServer();
			await server.init();
			class AlphaApi {
				@ApiHandler(() => ({method: 'get' as const, path: '/alpha'}), {httpServer: () => server})
				async get(_params: unknown) {
					return {name: 'alpha'};
				}
			}
			class BetaApi {
				@ApiHandler(() => ({method: 'get' as const, path: '/beta'}), {httpServer: () => server})
				async get(_params: unknown) {
					return {name: 'beta'};
				}
			}
			class GammaApi {
				@ApiHandler(() => ({method: 'post' as const, path: '/gamma'}), {httpServer: () => server})
				async post(body: { id: number }) {
					return {name: 'gamma', id: body?.id};
				}
			}
			new AlphaApi();
			new BetaApi();
			new GammaApi();

			const a = await request(server.getExpress()).get('/alpha').expect(200).expect('Content-Type', /json/);
			expect(a.body).to.deep.equal({name: 'alpha'});
			const b = await request(server.getExpress()).get('/beta').expect(200).expect('Content-Type', /json/);
			expect(b.body).to.deep.equal({name: 'beta'});
			const g = await request(server.getExpress())
				.post('/gamma')
				.set('Content-Type', 'application/json')
				.send({id: 99})
				.expect(200)
				.expect('Content-Type', /json/);
			expect(g.body).to.deep.equal({name: 'gamma', id: 99});
		});

		it('Unknown path returns 404 when other APIs are registered', async () => {
			const server = createTestServer();
			await server.init();
			class OnlyPingApi {
				@ApiHandler(() => ({method: 'get' as const, path: '/ping'}), {httpServer: () => server})
				async get(_params: unknown) {
					return {ok: true};
				}
			}
			new OnlyPingApi();

			await request(server.getExpress()).get('/ping').expect(200);
			const res = await request(server.getExpress()).get('/other');
			expect(res.status).to.equal(404);
		});
	});

	describe('Duplicate path', () => {
		it('Registering two APIs with same path throws on second addRoute', async () => {
			const server = createTestServer();
			await server.init();
			const apiDef = {method: 'get' as const, path: '/duplicate-path'};
			class FirstApi {
				@ApiHandler(() => apiDef, {httpServer: () => server})
				async get(_params: unknown) {
					return {first: true};
				}
			}
			class SecondApi {
				@ApiHandler(() => apiDef, {httpServer: () => server})
				async get(_params: unknown) {
					return {second: true};
				}
			}
			new FirstApi();
			expect(() => new SecondApi()).to.throw(Error, /Duplicate API path: \/duplicate-path/);
		});

		it('First registered API wins; duplicate registration fails before any request', async () => {
			const server = createTestServer();
			await server.init();
			const apiDef = {method: 'get' as const, path: '/only-one'};
			class OnlyOneApi {
				@ApiHandler(() => apiDef, {httpServer: () => server})
				async get(_params: unknown) {
					return {winner: true};
				}
			}
			new OnlyOneApi();
			try {
				class OtherApi {
					@ApiHandler(() => apiDef, {httpServer: () => server})
					async get(_params: unknown) {
						return {winner: false};
					}
				}
				new OtherApi();
				expect.fail('should have thrown');
			} catch (e) {
				expect((e as Error).message).to.include('Duplicate API path');
			}
			const res = await request(server.getExpress()).get('/only-one').expect(200);
			expect(res.body).to.deep.equal({winner: true});
		});
	});
});
