/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {resolveApiDef} from '../../../main/decorators/ClientApi.js';
import {strict as assert} from 'node:assert';

describe('resolveApiDef', () => {
	it('returns object unchanged when first arg is object', () => {
		const apiDef = {method: 'get', path: '/v1/test'};
		const thisArg = {};
		const out = resolveApiDef(apiDef, thisArg);
		assert.strictEqual(out, apiDef);
	});

	it('calls getter with thisArg and returns its result when first arg is function', () => {
		const apiDef = {method: 'post', path: '/v1/upsert'};
		let receivedThis: unknown = null;
		const getter = function (this: unknown) {
			receivedThis = this;
			return apiDef;
		};
		const thisArg = {id: 42};
		const out = resolveApiDef(getter, thisArg);
		assert.strictEqual(out, apiDef);
		assert.strictEqual(receivedThis, thisArg);
	});

	it('returns ApiDef from getter when getter returns different def per call', () => {
		let n = 0;
		const getter = function () {
			return {method: 'get', path: `/v1/call-${++n}`};
		};
		const first = resolveApiDef(getter, {});
		const second = resolveApiDef(getter, {});
		assert.strictEqual(first.path, '/v1/call-1');
		assert.strictEqual(second.path, '/v1/call-2');
	});
});
