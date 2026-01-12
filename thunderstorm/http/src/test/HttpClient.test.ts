/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {HttpClient_Class, HttpMethod, QueryApi} from '../main/index.js';
import {runSingleTestCase, TestSuite} from '@nu-art/ts-common/testing';
import {createTestApiDef, createTestClient} from './helpers.js';
import {expect} from 'chai';

type Input = {
	client: HttpClient_Class;
	config?: {
		origin?: string;
		timeout?: number;
		compress?: boolean;
		defaultHeaders?: { [key: string]: string | string[] | (() => string | string[]) };
	};
};

type Result = {
	origin: string;
	timeout: number;
	compress: boolean;
	headers: { [key: string]: string | string[] };
};

type TestSuite_HttpClient = TestSuite<Input, Result>;
type TestCase_HttpClient = TestSuite_HttpClient['testcases'][number];

const test = async (input: Input): Promise<Result> => {
	const client = input.client;
	if (input.config) {
		const config: any = {};
		if (input.config.origin)
			config.origin = input.config.origin;

		if (input.config.timeout !== undefined)
			config.timeout = input.config.timeout;

		if (input.config.compress !== undefined)
			config.compress = input.config.compress;

		client.setConfig(config);

		if (input.config.defaultHeaders) {
			Object.keys(input.config.defaultHeaders).forEach(key => {
				client.addDefaultHeader(key, input.config!.defaultHeaders![key]);
			});
		}
	}

	const headers = client.getDefaultHeaders();
	return {
		origin: client.getOrigin()!,
		timeout: (client as any).timeout,
		compress: client.shouldCompress() ?? false,
		headers
	};
};

const runTestCase = (testCase: TestCase_HttpClient) => () => runSingleTestCase(test, testCase);

describe('HttpClient - Configuration', () => {
	it('Default origin configuration', runTestCase({
		input: {
			client: createTestClient('https://httpbin.org')
		},
		result: {
			origin: 'https://httpbin.org',
			timeout: 30000,
			compress: false,
			headers: {}
		}
	}));

	it('Origin with trailing slash removed', runTestCase({
		input: {
			client: createTestClient('https://httpbin.org/')
		},
		result: {
			origin: 'https://httpbin.org',
			timeout: 30000,
			compress: false,
			headers: {}
		}
	}));

	it('Custom timeout configuration', runTestCase({
		input: {
			client: createTestClient(),
			config: {
				timeout: 5000
			}
		},
		result: async (actual) => {
			expect(actual.timeout).to.equal(5000);
			expect(actual.origin).to.equal('https://httpbin.org');
		}
	}));

	it('Compression configuration', runTestCase({
		input: {
			client: createTestClient(),
			config: {
				compress: true
			}
		},
		result: {
			origin: 'https://httpbin.org',
			timeout: 30000,
			compress: true,
			headers: {}
		}
	}));

	it('Default header - string value', runTestCase({
		input: {
			client: createTestClient(),
			config: {
				defaultHeaders: {
					'X-Test-Header': 'test-value'
				}
			}
		},
		result: async (actual) => {
			expect(actual.headers['x-test-header']).to.deep.equal(['test-value']);
		}
	}));

	it('Default header - array value', runTestCase({
		input: {
			client: createTestClient(),
			config: {
				defaultHeaders: {
					'X-Test-Header': ['value1', 'value2']
				}
			}
		},
		result: async (actual) => {
			expect(actual.headers['x-test-header']).to.deep.equal(['value1', 'value2']);
		}
	}));

	it('Default header - function value', runTestCase({
		input: {
			client: createTestClient(),
			config: {
				defaultHeaders: {
					'X-Test-Header': () => 'dynamic-value'
				}
			}
		},
		result: async (actual) => {
			expect(actual.headers['x-test-header']).to.deep.equal(['dynamic-value']);
		}
	}));

	it('Multiple default headers', runTestCase({
		input: {
			client: createTestClient(),
			config: {
				defaultHeaders: {
					'X-Header-1': 'value1',
					'X-Header-2': 'value2'
				}
			}
		},
		result: async (actual) => {
			expect(actual.headers['x-header-1']).to.deep.equal(['value1']);
			expect(actual.headers['x-header-2']).to.deep.equal(['value2']);
		}
	}));

	it('Default headers inherited by requests', async () => {
		const client = createTestClient();
		client.addDefaultHeader('X-Test-Header', 'test-value');

		const apiDef = createTestApiDef<QueryApi<any, any>>(HttpMethod.GET, '/headers');
		const request = client.createRequest(apiDef);
		const response = await request.execute();
		expect(response.headers['X-Test-Header']).to.equal('test-value');
	});
});
