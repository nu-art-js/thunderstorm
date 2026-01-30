/*
 * @nu-art/http-server - Express HTTP server and typed ServerApi
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Readable} from 'stream';
import request from 'supertest';
import {ApiException} from '@nu-art/ts-common';
import {ApiHandler, MemKey_HttpRequestHeaders, MemKey_HttpResponse} from '../../main/index.js';
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
				@ApiHandler(() => apiDef, {server: () => server})
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
				@ApiHandler(() => apiDef, {server: () => server})
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
				@ApiHandler(() => apiDef, {server: () => server})
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
				@ApiHandler(() => apiDef, {server: () => server})
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
				@ApiHandler(() => apiDef, {server: () => server})
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
				@ApiHandler(() => apiDef, {server: () => server})
				async patch(body: unknown) {
					return {received: body, empty: body == null || (typeof body === 'object' && Object.keys(body as object).length === 0)};
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
				@ApiHandler(() => apiDef, {server: () => server})
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
				@ApiHandler(() => apiDef, {server: () => server})
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
				@ApiHandler(() => apiDef, {server: () => server})
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
				@ApiHandler(() => apiDef, {server: () => server})
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
				@ApiHandler(() => apiDef, {server: () => server})
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
				@ApiHandler(() => apiDef, {server: () => server})
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
				@ApiHandler(() => apiDef, {server: () => server})
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
				@ApiHandler(() => apiDef, {server: () => server})
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
				@ApiHandler(() => apiDef, {server: () => server})
				async get(_params: unknown) {
					throw new ApiException(400, 'bad request');
				}
			}
			new Err400Api();

			const res = await request(server.getExpress()).get('/err400').expect(400).expect('Content-Type', /json/);
			expect(res.status).to.equal(400);
			expect(res.body).to.be.an('object');
			expect(res.body.debugMessage ?? res.body).to.satisfy((v: unknown) => typeof v === 'string' && v.includes('bad request'));
		});

		it('5xx: handler throws generic Error', async () => {
			const server = createTestServer();
			await server.init();
			const apiDef = {method: 'get' as const, path: '/err500'};
			class Err500Api {
				@ApiHandler(() => apiDef, {server: () => server})
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
					server: () => server,
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
	});
});
