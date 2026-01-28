/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {HttpMethod} from '@nu-art/http-client';
import {ClientApi, __setTestHttpClientFactory} from '../../../main/decorators/ClientApi.js';
import {createRequestStub} from './http-stub.js';
import {strict as assert} from 'node:assert';

const mockResponse = {id: '1', name: 'test'};

describe('ClientApi decorator - method inference', () => {
	let recorders: ReturnType<typeof createRequestStub>['recorder'][];

	beforeEach(() => {
		recorders = [];
		__setTestHttpClientFactory((apiDef: {method: string}) => {
			const {request, recorder} = createRequestStub(mockResponse);
			recorders.push(recorder);
			return request as any;
		});
	});

	afterEach(() => {
		__setTestHttpClientFactory(null);
	});

	it('uses setUrlParams for GET', async () => {
		class C {
			@ClientApi({method: HttpMethod.GET, path: '/v1/get'})
			async get(_p: Record<string, unknown>) {
				return undefined as any;
			}
		}
		const c = new C();
		await c.get({id: 'x'});
		assert.strictEqual(recorders.length, 1);
		assert.strictEqual(recorders[0].setUrlParamsCalled, true);
		assert.strictEqual(recorders[0].setBodyAsJsonCalled, false);
		assert.deepStrictEqual(recorders[0].params, {id: 'x'});
	});

	it('uses setUrlParams for DELETE', async () => {
		class C {
			@ClientApi({method: HttpMethod.DELETE, path: '/v1/delete'})
			async del(_p: Record<string, unknown>) {
				return undefined as any;
			}
		}
		const c = new C();
		await c.del({_id: 'y'});
		assert.strictEqual(recorders[0].setUrlParamsCalled, true);
		assert.strictEqual(recorders[0].setBodyAsJsonCalled, false);
	});

	it('uses setBodyAsJson for POST', async () => {
		class C {
			@ClientApi({method: HttpMethod.POST, path: '/v1/upsert'})
			async post(_b: Record<string, unknown>) {
				return undefined as any;
			}
		}
		const c = new C();
		await c.post({name: 'foo'});
		assert.strictEqual(recorders[0].setBodyAsJsonCalled, true);
		assert.strictEqual(recorders[0].setUrlParamsCalled, false);
		assert.deepStrictEqual(recorders[0].body, {name: 'foo'});
	});

	it('uses setBodyAsJson for PUT and PATCH', async () => {
		class C {
			@ClientApi({method: HttpMethod.PUT, path: '/v1/put'})
			async put(_b: Record<string, unknown>) {
				return undefined as any;
			}

			@ClientApi({method: HttpMethod.PATCH, path: '/v1/patch'})
			async patch(_b: Record<string, unknown>) {
				return undefined as any;
			}
		}
		const c = new C();
		await c.put({x: 1});
		assert.strictEqual(recorders[0].setBodyAsJsonCalled, true);
		await c.patch({y: 2});
		assert.strictEqual(recorders[1].setBodyAsJsonCalled, true);
	});
});
