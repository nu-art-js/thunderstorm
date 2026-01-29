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

import {ApiDef, HttpClient, HttpException, HttpMethod, QueryApi} from '../../main/index.js';
import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {createTestClient} from '../helpers.js';
import {expect} from 'chai';

type Input = {
	client: HttpClient;
	statusCode: number;
};

type Result = HttpException;

type TestCase_HttpErrors = TestModel<Input, Result>;

const test = async (input: Input): Promise<Result> => {
	const client = input.client;

	const request = client.createRequest({
		method: HttpMethod.GET,
		path: `/status/${input.statusCode}`,
	} as ApiDef<QueryApi<any, any>>);

	try {
		await request.execute();
		throw new Error('Expected HttpException');
	} catch (e: any) {
		if (e instanceof HttpException) {
			return e;
		}
		throw e;
	}
};

const runTestCase = (testCase: TestCase_HttpErrors) => () => runSingleTestCase(test, testCase);

describe('HttpRequest - Error Handling', () => {
	const client = createTestClient();

	it('400 Bad Request', runTestCase({
		input: {client, statusCode: 400},
		result: async (actual) => {
			expect(actual.responseCode).to.equal(400);
			expect(actual.message).to.include('400');
		}
	})).timeout(30000);

	it('401 Unauthorized', runTestCase({
		input: {client, statusCode: 401},
		result: async (actual) => {
			expect(actual.responseCode).to.equal(401);
			expect(actual.message).to.include('401');
		}
	})).timeout(30000);

	it('403 Forbidden', runTestCase({
		input: {client, statusCode: 403},
		result: async (actual) => {
			expect(actual.responseCode).to.equal(403);
		}
	})).timeout(30000);

	it('404 Not Found', runTestCase({
		input: {client, statusCode: 404},
		result: async (actual) => {
			expect(actual.responseCode).to.equal(404);
			expect(actual.message).to.include('404');
		}
	})).timeout(30000);

	it('500 Internal Server Error', runTestCase({
		input: {client, statusCode: 500},
		result: async (actual) => {
			expect(actual.responseCode).to.equal(500);
			expect(actual.message).to.include('500');
		}
	})).timeout(30000);

	it('502 Bad Gateway', runTestCase({
		input: {client, statusCode: 502},
		result: async (actual) => {
			expect(actual.responseCode).to.equal(502);
		}
	})).timeout(30000);

	it('503 Service Unavailable', runTestCase({
		input: {client, statusCode: 503},
		result: async (actual) => {
			expect(actual.responseCode).to.equal(503);
		}
	})).timeout(30000);

	it('Error callback execution', async () => {
		const client = createTestClient();
		let errorCallbackCalled = false;
		let capturedError: HttpException | undefined;

		const request = client.createRequest({
			method: HttpMethod.GET,
			path: '/status/404',
		} as ApiDef<QueryApi<any, any>>);

		request.setOnError(async (error: HttpException) => {
			errorCallbackCalled = true;
			capturedError = error;
		});

		try {
			await request.execute();
		} catch (e) {
			// Expected to throw
		}

		expect(errorCallbackCalled).to.be.true;
		expect(capturedError).to.exist;
		expect(capturedError!.responseCode).to.equal(404);
	}).timeout(30000);

	it('Error response parsing', runTestCase({
		input: {client, statusCode: 400},
		result: async (actual) => {
			expect(actual.responseCode).to.equal(400);
			expect(actual.errorResponse).to.exist;
		}
	})).timeout(30000);
});

