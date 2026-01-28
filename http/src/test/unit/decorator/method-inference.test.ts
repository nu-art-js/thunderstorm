/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiCaller, HttpMethod} from '../../../main/index.js';
import type {BodyApi, QueryApi} from '../../../main/types/api-types.js';
import type {ResponseError} from '../../../main/types/error-types.js';
import {createTestClient} from '../../helpers.js';
import {expect} from 'chai';

// httpbin.org response shapes
type GetResponse = {url: string; args: Record<string, string>; headers: Record<string, string>};
type PostResponse = {url: string; json?: Record<string, unknown>; data?: string};
type GetApi = QueryApi<GetResponse, {id?: string}>;
type PostApi = BodyApi<PostResponse, {name?: string}>;
type PutApi = BodyApi<PostResponse, Record<string, unknown>, Record<string, unknown>, ResponseError, typeof HttpMethod.PUT>;
type PatchApi = BodyApi<PostResponse, Record<string, unknown>, Record<string, unknown>, ResponseError, typeof HttpMethod.PATCH>;

describe('ApiCaller decorator - method inference', () => {
	const client = createTestClient();

	it('uses setUrlParams for GET', async () => {
		class C {
			@ApiCaller<GetApi>({method: HttpMethod.GET, path: '/get'}, {httpClient: client})
			async get(_p: Record<string, unknown>) {
				return undefined as any;
			}
		}
		const c = new C();
		const response = await c.get({id: 'x'});
		expect(response).to.be.an('object');
		expect(response.args).to.deep.equal({id: 'x'});
		expect(response.url).to.include('id=x');
	}).timeout(30000);

	it('uses setUrlParams for DELETE', async () => {
		class C {
			@ApiCaller({method: HttpMethod.DELETE, path: '/delete'}, {httpClient: client})
			async del(_p: Record<string, unknown>) {
				return undefined as any;
			}
		}
		const c = new C();
		const response = await c.del({_id: 'y'});
		expect(response).to.be.an('object');
		expect(response.args).to.deep.equal({_id: 'y'});
	}).timeout(30000);

	it('uses setBodyAsJson for POST', async () => {
		class C {
			@ApiCaller<PostApi>({method: HttpMethod.POST, path: '/post'}, {httpClient: client})
			async post(_b: Record<string, unknown>) {
				return undefined as any;
			}
		}
		const c = new C();
		const response = await c.post({name: 'foo'});
		expect(response).to.be.an('object');
		expect(response.json).to.deep.equal({name: 'foo'});
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
		const c = new C();
		const putResponse = await c.put({x: 1});
		expect(putResponse.json).to.deep.equal({x: 1});
		const patchResponse = await c.patch({y: 2});
		expect(patchResponse.json).to.deep.equal({y: 2});
	}).timeout(30000);
});
