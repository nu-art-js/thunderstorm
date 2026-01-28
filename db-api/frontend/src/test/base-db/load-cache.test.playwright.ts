/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';

test.describe('BaseDB - loadCache', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => (window as any).DbApiFrontend !== undefined);
		await page.evaluate(() => (window as any).DbApiFrontend.cleanupDbApiIDB());
	});

	test('after seeding IDB, loadCache() fills cache with expected length and contents', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi} = (window as any).DbApiFrontend;
			const api = new TestBaseApi();
			await api.init();

			const seed = [
				{_id: '1', name: 'a', __created: 1, __updated: 1, _v: 'v1'},
				{_id: '2', name: 'b', __created: 2, __updated: 2, _v: 'v1'}
			];
			await api.onEntriesUpdated(seed);
			await api.loadCache();

			const all = api.cache.all();
			return {length: all.length, items: all};
		});

		expect(result.length).toBe(2);
		expect(result.items).toContainEqual(expect.objectContaining({_id: '1', name: 'a'}));
		expect(result.items).toContainEqual(expect.objectContaining({_id: '2', name: 'b'}));
	});
});
