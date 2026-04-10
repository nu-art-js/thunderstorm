/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {HttpMethod, QueryApi} from '../../main/index.js';
import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {createTestApiDef, TestHttpClient} from '../helpers.js';
import {expect} from 'chai';

type Input = {
	path: string;
	params: Record<string, string>;
};

type Result = {
	url: string;
};

const testCases: TestModel<Input, Result>[] = [
	{
		description: 'path param is substituted and not duplicated as query param',
		input: {path: '/events/slug/:slug', params: {slug: 'my-event-slug'}},
		result: {url: 'https://test.local/events/slug/my-event-slug'},
	},
	{
		description: 'path param substituted, extra params become query',
		input: {path: '/users/:userId/items', params: {userId: '42', limit: '10'}},
		result: {url: 'https://test.local/users/42/items?limit=10'},
	},
	{
		description: 'no path params — all go to query string',
		input: {path: '/events', params: {slug: 'my-event-slug'}},
		result: {url: 'https://test.local/events?slug=my-event-slug'},
	},
];

describe('HttpRequest path param interpolation (integration)', function () {
	testCases.forEach(testCase => {
		it(testCase.description as string, async () => {
			await runSingleTestCase(async (input) => {
				const client = new TestHttpClient({origin: 'https://test.local'});
				client.setMockResponse({data: {}, status: 200, statusText: 'OK', headers: {}, config: {}});
				const apiDef = createTestApiDef<QueryApi<any, any>>(HttpMethod.GET, input.path);
				const request = client.createRequest(apiDef);
				request.setUrlParams(input.params as any);
				await request.execute();

				const actualUrl = client.lastOptions?.url!;
				expect(actualUrl).to.equal((testCase as any).result.url);
				return {url: actualUrl};
			}, testCase);
		});
	});
});
