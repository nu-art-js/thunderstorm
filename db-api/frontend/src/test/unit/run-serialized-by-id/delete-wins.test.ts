/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {strict as assert} from 'node:assert';

describe('runSerializedById - delete-wins', () => {
	let api: Awaited<typeof import('./test-base-api.js')>['TestBaseApi'] | null = null;

	before(async function (this: Mocha.Context) {
		try {
			const {TestBaseApi} = await import('./test-base-api.js');
			api = new TestBaseApi();
		} catch (_e) {
			this.skip();
		}
	});

	it('throws when upsert or patch is run while delete is running or pending for same id', async () => {
		if (!api)
			return;
		const id = 'del-1';
		const deletePromise = api.runSerializedByIdExposed(id, 'delete', () => new Promise<void>((r) => setTimeout(r, 50)));

		await assert.rejects(
			() => api.runSerializedByIdExposed(id, 'upsert', () => Promise.resolve(undefined as any)),
			/Item with id del-1 is marked for deletion/
		);
		await assert.rejects(
			() => api.runSerializedByIdExposed(id, 'patch', () => Promise.resolve(undefined as any)),
			/Item with id del-1 is marked for deletion/
		);

		await deletePromise;
	});
});
