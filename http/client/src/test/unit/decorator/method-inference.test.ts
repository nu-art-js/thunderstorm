/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiCaller, HttpMethod} from '../../../main/index.js';
import type {BodyApi, QueryApi} from '../../../main/index.js';
import type {ResponseError} from '../../../main/index.js';
import {expect} from 'chai';
import {TestHttpClient} from '../../helpers.js';

// httpbin.org response shapes
type GetResponse = { url: string; args: Record<string, string>; headers: Record<string, string> };
type PostResponse = { url: string; json?: Record<string, unknown>; data?: string };
type GetApi = QueryApi<GetResponse, { id?: string }>;
type PostApi = BodyApi<PostResponse, { name?: string }>;
type PutApi = BodyApi<PostResponse, Record<string, unknown>, ResponseError, typeof HttpMethod.PUT>;
type PatchApi = BodyApi<PostResponse, Record<string, unknown>, ResponseError, typeof HttpMethod.PATCH>;

describe('ApiCaller decorator - method inference', () => {
	const client = new TestHttpClient();
	client.setConfig({origin: 'https://example.org'});

	it('uses setUrlParams for GET', async () => {
		class C {
			@ApiCaller<GetApi>({method: HttpMethod.GET, path: '/get'}, {httpClient: client})
			async get(_p: Record<string, unknown>) {
				return undefined as any;
			}
		}

		const responseBody = {url: 'https://example.org/get?id=x', args: {id: 'x'}, headers: {}};
		client.setMockResponse({data: responseBody, status: 200, statusText: 'OK', headers: {}, config: {}});
		const c = new C();
		const response = await c.get({id: 'x'});
		expect(client.lastOptions).to.be.an('object');
		expect((client.lastOptions!.url as string)).to.include('id=x');
		expect(response).to.be.an('object');
		expect(response).to.deep.equal(responseBody);
	}).timeout(30000);

	it('uses setUrlParams for DELETE', async () => {
		class C {
			@ApiCaller({method: HttpMethod.DELETE, path: '/delete'}, {httpClient: client})
			async del(_p: Record<string, unknown>) {
				return undefined as any;
			}
		}

		const responseBody = {url: 'https://example.org/delete?_id=y', args: {_id: 'y'}, headers: {}};
		client.setMockResponse({data: responseBody, status: 200, statusText: 'OK', headers: {}, config: {}});
		const c = new C();
		const response = await c.del({_id: 'y'});
		expect(client.lastOptions).to.be.an('object');
		expect((client.lastOptions!.url as string)).to.include('_id=y');
		expect(response).to.deep.equal(responseBody);
	}).timeout(30000);

	it('uses setBodyAsJson for POST', async () => {
		class C {
			@ApiCaller<PostApi>({method: HttpMethod.POST, path: '/post'}, {httpClient: client})
			async post(_b: Record<string, unknown>) {
				return undefined as any;
			}
		}

		const responseBody = {url: 'https://example.org/post', json: {name: 'foo'}, data: ''};
		client.setMockResponse({data: responseBody, status: 200, statusText: 'OK', headers: {}, config: {}});
		const c = new C();
		const response = await c.post({name: 'foo'});
		expect(client.lastOptions).to.be.an('object');
		expect(client.lastOptions!.data).to.deep.equal({name: 'foo'});
		expect(response).to.deep.equal(responseBody);
	}).timeout(30000);

	it('uses setBodyAsJson for PUT and PATCH', async () => {
		class C {
			@ApiCaller<PutApi>({method: HttpMethod.PUT, path: '/put'}, {httpClient: client})
			async put(_b: Record<string, unknown>) {
				return undefined as any;
			}

			@ApiCaller<PatchApi>({method: HttpMethod.PATCH, path: '/patch'}, {httpClient: client})
			async patch(_b: Record<string, unknown>) {
				return undefined as any;
			}
		}

		const putBody = {url: 'https://example.org/put', json: {x: 1}};
		const patchBody = {url: 'https://example.org/patch', json: {y: 2}};
		client.setMockResponse({data: putBody, status: 200, statusText: 'OK', headers: {}, config: {}});
		const c = new C();
		const putResponse = await c.put({x: 1});
		expect(client.lastOptions!.data).to.deep.equal({x: 1});
		expect(putResponse).to.deep.equal(putBody);
		client.setMockResponse({data: patchBody, status: 200, statusText: 'OK', headers: {}, config: {}});
		const patchResponse = await c.patch({y: 2});
		expect(client.lastOptions!.data).to.deep.equal({y: 2});
		expect(patchResponse).to.deep.equal(patchBody);
	}).timeout(30000);
});
