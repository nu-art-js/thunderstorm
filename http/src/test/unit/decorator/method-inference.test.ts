/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiCaller, HttpClient_Class, HttpMethod} from '../../../main/index.js';
import {createRequestStub} from './http-stub.js';
import {strict as assert} from 'node:assert';

const mockResponse = {id: '1', name: 'test'};

describe('ApiCaller decorator - method inference', () => {
	it('uses setUrlParams for GET', async () => {
		const {request, recorder} = createRequestStub(mockResponse);
		const httpClient = {createRequest: () => request} as unknown as HttpClient_Class;
		class C {
			@ApiCaller({method: HttpMethod.GET, path: '/v1/get'}, {httpClient})
			async get(_p: Record<string, unknown>) {
				return undefined as any;
			}
		}
		const c = new C();
		await c.get({id: 'x'});
		assert.strictEqual(recorder.setUrlParamsCalled, true);
		assert.strictEqual(recorder.setBodyAsJsonCalled, false);
		assert.deepStrictEqual(recorder.params, {id: 'x'});
	});

	it('uses setUrlParams for DELETE', async () => {
		const {request, recorder} = createRequestStub(mockResponse);
		const httpClient = {createRequest: () => request} as unknown as HttpClient_Class;
		class C {
			@ApiCaller({method: HttpMethod.DELETE, path: '/v1/delete'}, {httpClient})
			async del(_p: Record<string, unknown>) {
				return undefined as any;
			}
		}
		const c = new C();
		await c.del({_id: 'y'});
		assert.strictEqual(recorder.setUrlParamsCalled, true);
		assert.strictEqual(recorder.setBodyAsJsonCalled, false);
	});

	it('uses setBodyAsJson for POST', async () => {
		const {request, recorder} = createRequestStub(mockResponse);
		const httpClient = {createRequest: () => request} as unknown as HttpClient_Class;
		class C {
			@ApiCaller({method: HttpMethod.POST, path: '/v1/upsert'}, {httpClient})
			async post(_b: Record<string, unknown>) {
				return undefined as any;
			}
		}
		const c = new C();
		await c.post({name: 'foo'});
		assert.strictEqual(recorder.setBodyAsJsonCalled, true);
		assert.strictEqual(recorder.setUrlParamsCalled, false);
		assert.deepStrictEqual(recorder.body, {name: 'foo'});
	});

	it('uses setBodyAsJson for PUT and PATCH', async () => {
		const recs: ReturnType<typeof createRequestStub>['recorder'][] = [];
		const httpClient = {
			createRequest: () => {
				const {request, recorder} = createRequestStub(mockResponse);
				recs.push(recorder);
				return request;
			}
		} as unknown as HttpClient_Class;
		class C {
			@ApiCaller({method: HttpMethod.PUT, path: '/v1/put'}, {httpClient})
			async put(_b: Record<string, unknown>) {
				return undefined as any;
			}

			@ApiCaller({method: HttpMethod.PATCH, path: '/v1/patch'}, {httpClient})
			async patch(_b: Record<string, unknown>) {
				return undefined as any;
			}
		}
		const c = new C();
		await c.put({x: 1});
		assert.strictEqual(recs[0].setBodyAsJsonCalled, true);
		await c.patch({y: 2});
		assert.strictEqual(recs[1].setBodyAsJsonCalled, true);
	});
});
