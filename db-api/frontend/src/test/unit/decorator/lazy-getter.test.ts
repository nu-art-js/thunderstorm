/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {HttpMethod} from '@nu-art/http-client';
import {ClientApi, __setTestHttpClientFactory} from '../../../main/decorators/ClientApi.js';
import {createRequestStub} from './http-stub.js';
import {strict as assert} from 'node:assert';

const mockResponse = {value: 42};

describe('ClientApi decorator - lazy getter', () => {
	beforeEach(() => {
		__setTestHttpClientFactory((apiDef) => {
			const {request} = createRequestStub(mockResponse);
			return request as any;
		});
	});

	afterEach(() => {
		__setTestHttpClientFactory(null);
	});

	it('calls ApiDef getter with this equal to instance and uses returned ApiDef for request', async () => {
		const apiDefFromGetter = {method: HttpMethod.GET, path: '/v1/lazy'};
		let receivedThis: unknown = null;
		class C {
			getApiDef() {
				receivedThis = this;
				return apiDefFromGetter;
			}

			@ClientApi(function (this: C) {
				return this.getApiDef();
			})
			async fetch() {
				return undefined as any;
			}
		}
		const c = new C();
		await c.fetch();
		assert.strictEqual(receivedThis, c);
	});
});
