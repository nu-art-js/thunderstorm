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

import {ApiDef, BodyApi, HttpClient, HttpMethod, HttpRequest, QueryApi} from '../../main/index.js';
import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {createTestApiDef, createTestClient} from '../helpers.js';
import {expect} from 'chai';

// Test API types
type GetApi = QueryApi<{ url: string; args: any; headers: any }, { test?: string }>;
type PostApi = BodyApi<{ json: any; data?: string; url: string }, { test?: string }>;

type Input = {
	client: HttpClient;
	apiDef: ApiDef<any>;
	requestData?: string;
	setup?: (request: HttpRequest<any>) => HttpRequest<any>;
};

type Result = {
	status: number;
	data: any;
	headers?: Record<string, string>;
};

type TestCase_HttpRequest = TestModel<Input, Result>;

const test = async (input: Input): Promise<Result> => {
	const request = input.client.createRequest(input.apiDef, input.requestData);
	const configuredRequest = input.setup ? input.setup(request) : request;
	const response = await configuredRequest.execute();
	const status = configuredRequest.getStatus();
	const contentType = configuredRequest.getResponseHeader('content-type');

	return {
		status,
		data: response,
		headers: contentType ? {'content-type': String(contentType)} : undefined
	};
};

const runTestCase = (testCase: TestCase_HttpRequest) => () => runSingleTestCase(test, testCase);

describe('HttpRequest - Basic Methods', () => {
	const client = createTestClient();

	it('GET request with query parameters', runTestCase({
		input: {
			client,
			apiDef: createTestApiDef<GetApi>(HttpMethod.GET, '/get'),
			setup: (req) => req.setUrlParams({test: 'value'})
		},
		result: async (actual) => {
			expect(actual.status).to.equal(200);
			expect(actual.data.args.test).to.equal('value');
			expect(actual.data.url).to.include('test=value');
		}
	})).timeout(30000);

	it('GET request without parameters', runTestCase({
		input: {
			client,
			apiDef: createTestApiDef<GetApi>(HttpMethod.GET, '/get')
		},
		result: async (actual) => {
			expect(actual.status).to.equal(200);
			expect(actual.data.url).to.include('httpbin.org/get');
		}
	})).timeout(30000);

	it('POST request with JSON body', runTestCase({
		input: {
			client,
			apiDef: createTestApiDef<PostApi>(HttpMethod.POST, '/post'),
			setup: (req) => req.setBodyAsJson({test: 'value'})
		},
		result: async (actual) => {
			expect(actual.status).to.equal(200);
			expect(actual.data.json.test).to.equal('value');
			expect(actual.headers?.['content-type']).to.include('application/json');
		}
	})).timeout(30000);

	it('POST request with plain text body', runTestCase({
		input: {
			client,
			apiDef: createTestApiDef<PostApi>(HttpMethod.POST, '/post'),
			setup: (req) => req.setBody('plain text body')
		},
		result: async (actual) => {
			expect(actual.status).to.equal(200);
			expect(actual.data.data).to.equal('plain text body');
		}
	})).timeout(30000);

	it('PUT request with body', runTestCase({
		input: {
			client,
			apiDef: createTestApiDef<PostApi>(HttpMethod.PUT, '/put'),
			setup: (req) => req.setBodyAsJson({data: 'put-data'})
		},
		result: async (actual) => {
			expect(actual.status).to.equal(200);
			expect(actual.data.json.data).to.equal('put-data');
		}
	})).timeout(30000);

	it('PATCH request with body', runTestCase({
		input: {
			client,
			apiDef: createTestApiDef<PostApi>(HttpMethod.PATCH, '/patch'),
			setup: (req) => req.setBodyAsJson({data: 'patch-data'})
		},
		result: async (actual) => {
			expect(actual.status).to.equal(200);
			expect(actual.data.json.data).to.equal('patch-data');
		}
	})).timeout(30000);

	it('DELETE request', runTestCase({
		input: {
			client,
			apiDef: createTestApiDef<GetApi>(HttpMethod.DELETE, '/delete')
		},
		result: async (actual) => {
			expect(actual.status).to.equal(200);
		}
	})).timeout(30000);

	it('HEAD request', runTestCase({
		input: {
			client,
			apiDef: createTestApiDef<GetApi>(HttpMethod.HEAD, '/get')
		},
		result: async (actual) => {
			expect(actual.status).to.equal(200);
			// HEAD requests typically have no body
		}
	})).timeout(30000);

	it('OPTIONS request', runTestCase({
		input: {
			client,
			apiDef: createTestApiDef<GetApi>(HttpMethod.OPTIONS, '/get')
		},
		result: async (actual) => {
			expect(actual.status).to.equal(200);
		}
	})).timeout(30000);

	it('GET request with multiple query parameters', runTestCase({
		input: {
			client,
			apiDef: createTestApiDef<GetApi>(HttpMethod.GET, '/get'),
			setup: (req) => req
				.setUrlParam('param1', 'value1')
				.setUrlParam('param2', 'value2')
		},
		result: async (actual) => {
			expect(actual.status).to.equal(200);
			expect(actual.data.args.param1).to.equal('value1');
			expect(actual.data.args.param2).to.equal('value2');
		}
	})).timeout(30000);

	it('POST request with query parameters and body', runTestCase({
		input: {
			client,
			apiDef: createTestApiDef<PostApi>(HttpMethod.POST, '/post'),
			setup: (req) => req
				.setUrlParams({query: 'param'})
				.setBodyAsJson({body: 'data'})
		},
		result: async (actual) => {
			expect(actual.status).to.equal(200);
			expect(actual.data.args.query).to.equal('param');
			expect(actual.data.json.body).to.equal('data');
		}
	})).timeout(30000);
});

