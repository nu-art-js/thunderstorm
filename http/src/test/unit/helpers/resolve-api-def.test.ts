/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {resolveContent} from '@nu-art/ts-common';
import {strict as assert} from 'node:assert';

describe('resolveContent (ResolvableContent for ApiDef)', () => {
	it('returns object unchanged when first arg is object', () => {
		const apiDef = {method: 'get', path: '/v1/test'};
		const thisArg = {};
		const out = resolveContent(apiDef, thisArg);
		assert.strictEqual(out, apiDef);
	});

	it('calls getter with first arg and returns its result when content is function', () => {
		const apiDef = {method: 'post', path: '/v1/upsert'};
		let receivedArg: unknown = null;
		const getter = (arg: unknown) => {
			receivedArg = arg;
			return apiDef;
		};
		const thisArg = {id: 42};
		const out = resolveContent(getter, thisArg);
		assert.strictEqual(out, apiDef);
		assert.strictEqual(receivedArg, thisArg);
	});

	it('returns ApiDef from getter when getter returns different def per call', () => {
		let n = 0;
		const getter = () => {
			return {method: 'get', path: `/v1/call-${++n}`};
		};
		const first = resolveContent(getter, {});
		const second = resolveContent(getter, {});
		assert.strictEqual(first.path, '/v1/call-1');
		assert.strictEqual(second.path, '/v1/call-2');
	});
});
