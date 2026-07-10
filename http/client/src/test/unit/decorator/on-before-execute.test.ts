/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiCaller, HttpMethod, HttpRequest} from '../../../main/index.js';
import type {BodyApi} from '../../../main/index.js';
import {expect} from 'chai';
import {TestHttpClient} from '../../helpers.js';

type PostApi = BodyApi<{ ok: boolean }, { name: string }>;

describe('ApiCaller decorator - onBeforeExecute', () => {
	const client = new TestHttpClient();
	client.setConfig({origin: 'https://example.org'});

	it('runs after the request is built, before execute, and its edits reach the wire', async () => {
		const order: string[] = [];

		class C {
			@ApiCaller<PostApi, C>(
				{method: HttpMethod.POST, path: '/post'},
				{
					httpClient: client,
					onBeforeExecute: (_m: C, req: HttpRequest<PostApi>) => {
						order.push('onBeforeExecute');
						req.addHeader('x-hook', 'applied');
					},
					onComplete: (_m: C) => {
						order.push('onComplete');
					},
				}
			)
			async create(_body: { name: string }) {
				return undefined as any;
			}
		}

		client.setMockResponse({data: {ok: true}, status: 200, statusText: 'OK', headers: {}, config: {}});
		await new C().create({name: 'foo'});

		// hook fires before onComplete (i.e. before execute resolves)
		expect(order).to.deep.equal(['onBeforeExecute', 'onComplete']);
		// the header the hook added on the built request was sent
		const headers = client.lastOptions?.headers as Record<string, string> | undefined;
		expect(headers?.['x-hook']).to.equal('applied');
	}).timeout(30000);

	it('is optional - request executes normally when omitted', async () => {
		class C {
			@ApiCaller<PostApi, C>({method: HttpMethod.POST, path: '/post'}, {httpClient: client})
			async create(_body: { name: string }) {
				return undefined as any;
			}
		}

		client.setMockResponse({data: {ok: true}, status: 200, statusText: 'OK', headers: {}, config: {}});
		const response = await new C().create({name: 'bar'});
		expect(response).to.deep.equal({ok: true});
	}).timeout(30000);
});
