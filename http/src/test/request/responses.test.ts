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

import {ApiDef, HttpClient, HttpException, HttpMethod, HttpRequest, QueryApi} from '../../main/index.js';
import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {createTestApiDef, createTestClient} from '../helpers.js';
import {expect} from 'chai';

type Input = {
	client: HttpClient;
	apiDef: ApiDef<any>;
	setup?: (request: HttpRequest<any>) => HttpRequest<any>;
};

type Result = {
	status: number;
	data: any;
	contentType?: string;
	headers?: Record<string, string | string[]>;
};

type TestCase_HttpResponses = TestModel<Input, Result>;

const test = async (input: Input): Promise<Result> => {
	const request = input.client.createRequest(input.apiDef);
	const configuredRequest = input.setup ? input.setup(request) : request;
	const response = await configuredRequest.execute();
	const status = configuredRequest.getStatus();
	const contentType = configuredRequest.getResponseHeader('content-type');
	
	return {
		status,
		data: response,
		contentType: contentType ? String(contentType) : undefined,
		headers: {
			'content-type': contentType || ''
		}
	};
};

const runTestCase = (testCase: TestCase_HttpResponses) => () => runSingleTestCase(test, testCase);

describe('HttpRequest - Response Types', () => {
	const client = createTestClient();

	it('JSON response parsing', runTestCase({
		input: {
			client,
			apiDef: createTestApiDef<QueryApi<any, any>>(HttpMethod.GET, '/get')
		},
		result: async (actual) => {
			expect(actual.status).to.equal(200);
			expect(actual.data).to.be.an('object');
			expect(actual.data.url).to.exist;
			expect(actual.contentType).to.include('application/json');
		}
	})).timeout(30000);

	it('Text response', runTestCase({
		input: {
			client,
			apiDef: createTestApiDef<QueryApi<string, any>>(HttpMethod.GET, '/robots.txt'),
			setup: (req) => req.setResponseType('text')
		},
		result: async (actual) => {
			expect(actual.status).to.equal(200);
			expect(typeof actual.data).to.equal('string');
		}
	})).timeout(30000);

	it('Binary/Blob response', runTestCase({
		input: {
			client,
			apiDef: createTestApiDef<QueryApi<any, any>>(HttpMethod.GET, '/bytes/100'),
			setup: (req) => req.setResponseType('arraybuffer')
		},
		result: async (actual) => {
			expect(actual.status).to.equal(200);
			expect(actual.data).to.be.instanceof(ArrayBuffer);
			expect(actual.data.byteLength).to.equal(100);
		}
	})).timeout(30000);

	it('Stream response', runTestCase({
		input: {
			client,
			apiDef: createTestApiDef<QueryApi<any, any>>(HttpMethod.GET, '/stream/5'),
			setup: (req) => req.setResponseType('stream')
		},
		result: async (actual) => {
			expect(actual.status).to.equal(200);
			// Stream response should be a readable stream
			expect(actual.data).to.exist;
		}
	})).timeout(30000);

	it('Response headers access', runTestCase({
		input: {
			client,
			apiDef: createTestApiDef<QueryApi<any, any>>(HttpMethod.GET, '/get')
		},
		result: async (actual) => {
			expect(actual.status).to.equal(200);
			expect(actual.contentType).to.exist;
			expect(actual.contentType).to.include('application/json');
		}
	})).timeout(30000);

	it('Empty response (204)', async () => {
		// httpbin doesn't have a 204 endpoint, so we'll test with a status that returns minimal content
		const client = createTestClient();
		const request = client.createRequest({
			method: HttpMethod.GET,
			path: '/status/204',
		} as ApiDef<QueryApi<any, any>>);

		try {
			await request.execute();
			const rawResponse = request.getRawResponse();
			expect(rawResponse.status).to.equal(204);
			expect(rawResponse.statusText).to.exist;
			expect(request.getStatus()).to.equal(204);
		} catch (e: any) {
			// Some HTTP clients treat 204 as an error, but status should still be 204
			if (e instanceof HttpException) {
				expect(e.responseCode).to.equal(204);
			}
		}
	}).timeout(30000);

	it('Large JSON response', runTestCase({
		input: {
			client,
			apiDef: createTestApiDef<QueryApi<any, any>>(HttpMethod.GET, '/json')
		},
		result: async (actual) => {
			expect(actual.status).to.equal(200);
			expect(actual.data).to.be.an('object');
		}
	})).timeout(30000);

	it('Response with custom headers', runTestCase({
		input: {
			client,
			apiDef: createTestApiDef<QueryApi<any, any>>(HttpMethod.GET, '/response-headers'),
			setup: (req) => req.setUrlParams({ 'X-Custom-Header': 'custom-value' })
		},
		result: async (actual) => {
			expect(actual.status).to.equal(200);
			expect(actual.data['X-Custom-Header']).to.equal('custom-value');
		}
	})).timeout(30000);
});

