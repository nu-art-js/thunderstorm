/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {interpolatePathParams} from '../../../main/utils/utils.js';
import {expect} from 'chai';
import {runSingleTestCase, TestModel} from '@nu-art/testalot';

type Input = { url: string; params: Record<string, string | number | boolean | undefined> };
type Result = { url: string; remainingParams: Record<string, string | number | boolean | undefined> };

const testCases: TestModel<Input, Result>[] = [
	{
		description: 'substitutes single path param',
		input: {url: '/events/slug/:slug', params: {slug: 'my-event-slug'}},
		result: {url: '/events/slug/my-event-slug', remainingParams: {}},
	},
	{
		description: 'substitutes multiple path params',
		input: {url: '/users/:userId/posts/:postId', params: {userId: '42', postId: '99'}},
		result: {url: '/users/42/posts/99', remainingParams: {}},
	},
	{
		description: 'preserves extra params as remaining',
		input: {url: '/events/slug/:slug', params: {slug: 'my-slug', limit: '10', offset: '0'}},
		result: {url: '/events/slug/my-slug', remainingParams: {limit: '10', offset: '0'}},
	},
	{
		description: 'leaves unmatched tokens as-is',
		input: {url: '/events/:eventId/markets/:marketId', params: {eventId: 'abc'}},
		result: {url: '/events/abc/markets/:marketId', remainingParams: {}},
	},
	{
		description: 'no-op when url has no path params',
		input: {url: '/events', params: {slug: 'my-slug'}},
		result: {url: '/events', remainingParams: {slug: 'my-slug'}},
	},
	{
		description: 'no-op when params is empty',
		input: {url: '/events/slug/:slug', params: {}},
		result: {url: '/events/slug/:slug', remainingParams: {}},
	},
	{
		description: 'encodes special characters in param value',
		input: {url: '/search/:query', params: {query: 'hello world&foo=bar'}},
		result: {url: '/search/hello%20world%26foo%3Dbar', remainingParams: {}},
	},
	{
		description: 'handles numeric param values',
		input: {url: '/items/:id', params: {id: 123}},
		result: {url: '/items/123', remainingParams: {}},
	},
	{
		description: 'skips undefined param values',
		input: {url: '/items/:id', params: {id: undefined}},
		result: {url: '/items/:id', remainingParams: {id: undefined}},
	},
];

describe('interpolatePathParams', function () {
	testCases.forEach(testCase => {
		it(testCase.description as string, async () => {
			await runSingleTestCase(async (input) => {
				const result = interpolatePathParams(input.url, input.params);
				expect(result.url).to.equal((testCase as any).result.url);
				expect(result.remainingParams).to.deep.equal((testCase as any).result.remainingParams);
				return result;
			}, testCase);
		});
	});
});
