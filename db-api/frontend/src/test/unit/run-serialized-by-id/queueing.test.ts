/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {strict as assert} from 'node:assert';

describe('runSerializedById - queueing', () => {
	let api: Awaited<typeof import('./test-base-api.js')>['TestBaseApi'] | null = null;

	before(async function (this: Mocha.Context) {
		try {
			const {TestBaseApi} = await import('./test-base-api.js');
			api = new TestBaseApi();
		} catch (_e) {
			this.skip();
		}
	});

	it('queues second call for same id until first completes; order is deterministic', async () => {
		if (!api)
			return;
		const id = 'q-1';
		const order: number[] = [];
		const delay = (ms: number, n: number) => () =>
			new Promise<void>((res) => {
				setTimeout(() => {
					order.push(n);
					res();
				}, ms);
			});

		const first = api.runSerializedByIdExposed(id, 'upsert', delay(20, 1));
		const second = api.runSerializedByIdExposed(id, 'upsert', delay(5, 2));

		await Promise.all([first, second]);
		assert.deepStrictEqual(order, [1, 2], 'first must finish before second runs');
	});
});
