/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {HttpMethod} from '@nu-art/http-client';
import {isQueryMethod} from '../../../main/decorators/ClientApi.js';
import {strict as assert} from 'node:assert';

describe('isQueryMethod', () => {
	it('returns true for GET', () => {
		assert.strictEqual(isQueryMethod(HttpMethod.GET), true);
	});

	it('returns true for DELETE', () => {
		assert.strictEqual(isQueryMethod(HttpMethod.DELETE), true);
	});

	it('returns false for POST', () => {
		assert.strictEqual(isQueryMethod(HttpMethod.POST), false);
	});

	it('returns false for PUT', () => {
		assert.strictEqual(isQueryMethod(HttpMethod.PUT), false);
	});

	it('returns false for PATCH', () => {
		assert.strictEqual(isQueryMethod(HttpMethod.PATCH), false);
	});

	it('returns false for unknown method string', () => {
		assert.strictEqual(isQueryMethod('OPTIONS'), false);
		assert.strictEqual(isQueryMethod('HEAD'), false);
	});
});
