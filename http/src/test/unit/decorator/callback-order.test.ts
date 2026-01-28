/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiCaller, HttpMethod} from '../../../main/index.js';
import type {ApiCallContext} from '../../../main/types/ApiCaller-types.js';
import type {BodyApi} from '../../../main/types/api-types.js';
import {createTestClient} from '../../helpers.js';
import {expect} from 'chai';

// httpbin.org POST /post echoes json in response.json
type PostResponse = {url: string; json?: Record<string, unknown>};
type UpsertApi = BodyApi<PostResponse, {name: string}>;

describe('ApiCaller decorator - callback order', () => {
	const client = createTestClient();

	it('calls onComplete then userCallback in order with real response', async () => {
		const order: string[] = [];
		class C {
			@ApiCaller<UpsertApi, C>(
				{method: HttpMethod.POST, path: '/post'},
				{
					httpClient: client,
					onComplete: (_module: C, ctx: ApiCallContext<UpsertApi>) => {
						order.push('onComplete');
						order.push(String(ctx.response?.json?.name));
					}
				}
			)
			async upsert(_body: {name: string}, userCallback?: (ctx: ApiCallContext<UpsertApi>) => void | Promise<void>) {
				return undefined as any;
			}
		}
		const c = new C();
		await c.upsert(
			{name: 'foo'},
			(ctx: ApiCallContext<UpsertApi>) => {
				order.push('userCallback');
				order.push(String(ctx.response?.json?.name));
			}
		);
		expect(order).to.deep.equal(['onComplete', 'foo', 'userCallback', 'foo']);
	}).timeout(30000);
});
