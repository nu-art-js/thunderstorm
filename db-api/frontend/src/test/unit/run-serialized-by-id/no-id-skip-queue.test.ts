/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {strict as assert} from 'node:assert';

describe('runSerializedById - no-id-skip-queue', () => {
	let api: Awaited<typeof import('./test-base-api.js')>['TestBaseApi'] | null = null;

	before(async function (this: Mocha.Context) {
		try {
			const {TestBaseApi} = await import('./test-base-api.js');
			api = new TestBaseApi();
		} catch (_e) {
			this.skip();
		}
	});

	it('runs immediately when id is undefined and no queue entry is used', async () => {
		if (!api)
			return;
		const order: number[] = [];
		const p = api.runSerializedByIdExposed(undefined, 'upsert', () => {
			order.push(1);
			return Promise.resolve(1);
		});
		order.push(0);
		const result = await p;
		assert.strictEqual(result, 1);
		assert.deepStrictEqual(order, [0, 1]);
	});

	it('runs immediately when id is empty string and no queue entry is used', async () => {
		if (!api)
			return;
		const result = await api.runSerializedByIdExposed('', 'upsert', () => Promise.resolve(2));
		assert.strictEqual(result, 2);
	});
});
