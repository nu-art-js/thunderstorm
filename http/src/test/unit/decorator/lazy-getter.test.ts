/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiCaller, HttpClient_Class, HttpMethod} from '../../../main/index.js';
import {createRequestStub} from './http-stub.js';
import {strict as assert} from 'node:assert';

const mockResponse = {value: 42};

describe('ApiCaller decorator - lazy getter', () => {
	it('calls ApiDef getter with this equal to instance and uses returned ApiDef for request', async () => {
		const {request} = createRequestStub(mockResponse);
		const httpClient = {createRequest: () => request} as unknown as HttpClient_Class;
		const apiDefFromGetter = {method: HttpMethod.GET, path: '/v1/lazy'};
		let receivedThis: unknown = null;
		class C {
			getApiDef() {
				receivedThis = this;
				return apiDefFromGetter;
			}

			@ApiCaller(function (m: C) {
				return m.getApiDef();
			}, {httpClient})
			async fetch() {
				return undefined as any;
			}
		}
		const c = new C();
		await c.fetch();
		assert.strictEqual(receivedThis, c);
	});
});
