/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {HttpMethod} from '@nu-art/http-client';
import {ClientApi, __setTestHttpClientFactory} from '../../../main/decorators/ClientApi.js';
import {createRequestStub} from './http-stub.js';
import {strict as assert} from 'node:assert';

const mockResponse = {id: 'r1', name: 'from-server'};

describe('ClientApi decorator - callback order', () => {
	beforeEach(() => {
		__setTestHttpClientFactory((apiDef) => {
			const {request} = createRequestStub(mockResponse);
			return request as any;
		});
	});

	afterEach(() => {
		__setTestHttpClientFactory(null);
	});

	it('runs preprocess, then HTTP, then onComplete(module, ctx), then userCallback(ctx); ctx has response, body/params', async () => {
		const order: string[] = [];
		let onCompleteCtx: {response: unknown; body?: unknown; params?: unknown} | null = null;
		let userCallbackCtx: {response: unknown; body?: unknown; params?: unknown} | null = null;

		class C {
			@ClientApi(
				{method: HttpMethod.POST, path: '/v1/upsert'},
				{
					onComplete: (m, ctx) => {
						order.push('onComplete');
						onCompleteCtx = {response: ctx.response, body: ctx.body, params: ctx.params};
					}
				}
			)
			async upsert(body: {name: string}) {
				order.push('preprocess');
				return body;
			}
		}
		const c = new C();
		const payload = {name: 'alice'};
		await c.upsert(payload, (ctx) => {
			order.push('userCallback');
			userCallbackCtx = {response: ctx.response, body: ctx.body, params: ctx.params};
		});

		assert.deepStrictEqual(order, ['preprocess', 'onComplete', 'userCallback']);
		assert.strictEqual(onCompleteCtx?.response, mockResponse);
		assert.deepStrictEqual(onCompleteCtx?.body, payload);
		assert.deepStrictEqual(userCallbackCtx?.response, mockResponse);
		assert.deepStrictEqual(userCallbackCtx?.body, payload);
	});
});
