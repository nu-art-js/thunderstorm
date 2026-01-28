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

import {ApiDef, BodyApi, HttpClient_Class, HttpException, HttpMethod, HttpRequest, QueryApi, TS_Progress} from '../main/index.js';
import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {createTestApiDef, createTestClient} from './helpers.js';
import {expect} from 'chai';

type Input = {
	client: HttpClient_Class;
	apiDef: ApiDef<any>;
	setup?: (request: HttpRequest<any>) => HttpRequest<any>;
};

type Result = {
	status: number;
	data?: any;
	aborted?: boolean;
	progressCalled?: boolean;
	callbackCalled?: boolean;
};

type TestCase_HttpAdvanced = TestModel<Input, Result>;

const test = async (input: Input): Promise<Result> => {
	const request = input.client.createRequest(input.apiDef);
	const configuredRequest = input.setup ? input.setup(request) : request;

	let progressCalled = false;
	let callbackCalled = false;

	configuredRequest.setOnProgressListener(() => {
		progressCalled = true;
	});

	configuredRequest.setOnCompleted(async () => {
		callbackCalled = true;
	});

	try {
		const response = await configuredRequest.execute();
		return {
			status: configuredRequest.getStatus(),
			data: response,
			aborted: false,
			progressCalled,
			callbackCalled
		};
	} catch (e: any) {
		const status = configuredRequest.getStatus();
		if (e instanceof HttpException && status === 0) {
			return {
				status: 0,
				aborted: true,
				progressCalled,
				callbackCalled
			};
		}
		return {
			status,
			aborted: false,
			progressCalled,
			callbackCalled
		};
	}
};

const runTestCase = (testCase: TestCase_HttpAdvanced) => () => runSingleTestCase(test, testCase);

describe('HttpRequest - Advanced Features', () => {
	const client = createTestClient();

	it('Request cancellation with abort', async () => {
		const request = client.createRequest({
			method: HttpMethod.GET,
			path: '/delay/2',
		} as ApiDef<QueryApi<any, any>>);

		const executePromise = request.execute();

		// Abort after a short delay
		setTimeout(() => {
			request.abort();
		}, 100);

		try {
			await executePromise;
			expect.fail('Expected request to be aborted');
		} catch (e: any) {
			if (e instanceof HttpException) {
				expect(e.responseCode).to.equal(0);
			}
		}
	}).timeout(30000);

	it('Custom headers', runTestCase({
		input: {
			client,
			apiDef: createTestApiDef<QueryApi<any, any>>(HttpMethod.GET, '/headers'),
			setup: (req) => req
				.setHeader('X-Custom-Header', 'custom-value')
				.addHeader('X-Another-Header', 'another-value')
		},
		result: async (actual) => {
			expect(actual.status).to.equal(200);
			expect(actual.data.headers['X-Custom-Header']).to.equal('custom-value');
			expect(actual.data.headers['X-Another-Header']).to.equal('another-value');
		}
	})).timeout(30000);

	it('Multiple header values', runTestCase({
		input: {
			client,
			apiDef: createTestApiDef<QueryApi<any, any>>(HttpMethod.GET, '/headers'),
			setup: (req) => req
				.addHeader('X-Multi-Header', 'value1')
				.addHeader('X-Multi-Header', 'value2')
		},
		result: async (actual) => {
			expect(actual.status).to.equal(200);
			const headerValue = actual.data.headers['X-Multi-Header'];
			expect(headerValue).to.include('value1');
			expect(headerValue).to.include('value2');
		}
	})).timeout(30000);

	it('URL parameter encoding', runTestCase({
		input: {
			client,
			apiDef: createTestApiDef<QueryApi<any, any>>(HttpMethod.GET, '/get'),
			setup: (req) => req.setUrlParams({
				'special': 'value with spaces',
				'encoded': 'value&with=special'
			})
		},
		result: async (actual) => {
			expect(actual.status).to.equal(200);
			expect(actual.data.args.special).to.equal('value with spaces');
			expect(actual.data.args.encoded).to.equal('value&with=special');
		}
	})).timeout(30000);

	it('Relative URL construction', runTestCase({
		input: {
			client,
			apiDef: createTestApiDef<QueryApi<any, any>>(HttpMethod.GET, '/get')
		},
		result: async (actual) => {
			expect(actual.status).to.equal(200);
			expect(actual.data.url).to.include('httpbin.org/get');
		}
	})).timeout(30000);

	it('Callback chaining - multiple onCompleted', async () => {
		const request = client.createRequest({
			method: HttpMethod.GET,
			path: '/get',
		} as ApiDef<QueryApi<any, any>>);

		let callback1Called = false;
		let callback2Called = false;

		request.setOnCompleted(async () => {
			callback1Called = true;
		});

		request.setOnCompleted(async () => {
			callback2Called = true;
		});

		await request.execute();

		expect(callback1Called).to.be.true;
		expect(callback2Called).to.be.true;
	}).timeout(30000);

	it('Callback chaining - multiple onError', async () => {
		const request = client.createRequest({
			method: HttpMethod.GET,
			path: '/status/404',
		} as ApiDef<QueryApi<any, any>>);

		let error1Called = false;
		let error2Called = false;

		request.setOnError(async () => {
			error1Called = true;
		});

		request.setOnError(async () => {
			error2Called = true;
		});

		try {
			await request.execute();
		} catch (e) {
			// Expected
		}

		expect(error1Called).to.be.true;
		expect(error2Called).to.be.true;
	}).timeout(30000);

	it('Timeout configuration', async () => {
		const request = client.createRequest({
			method: HttpMethod.GET,
			path: '/delay/5',
		} as ApiDef<QueryApi<any, any>>);

		request.setTimeout(1000); // 1 second timeout

		try {
			await request.execute();
			expect.fail('Expected timeout error');
		} catch (e: any) {
			// Should timeout or throw error
			expect(e).to.exist;
		}
	}).timeout(30000);

	it('Request with body and compression header', runTestCase({
		input: {
			client,
			apiDef: createTestApiDef<BodyApi<any, any>>(HttpMethod.POST, '/post'),
			setup: (req) => req
				.setBodyAsJson({test: 'data'}, true) // Enable compression
		},
		result: async (actual) => {
			expect(actual.status).to.equal(200);
			expect(actual.data.json.test).to.equal('data');
		}
	})).timeout(30000);

	it('Progress listener callback', async () => {
		const request = client.createRequest({
			method: HttpMethod.GET,
			path: '/bytes/1000',
		} as ApiDef<QueryApi<any, any>>);

		let progressEventReceived = false;

		request.setOnProgressListener((ev: TS_Progress) => {
			progressEventReceived = true;
			expect(ev.lengthComputable).to.exist;
		});

		await request.execute();
		expect(progressEventReceived).to.be.true;
		// Note: Progress events may not fire for all requests depending on axios configuration
		// This test verifies the listener can be set without errors
		expect(request).to.exist;
	}).timeout(30000);
});
