/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';

test.describe('BaseDB - sync', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => (window as any).DbApiFrontend !== undefined);
		await page.evaluate(() => (window as any).DbApiFrontend.cleanupDbApiIDB());
	});

	test('onEntriesUpdated updates IDB and cache', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi} = (window as any).DbApiFrontend;
			const api = new TestBaseApi();
			await api.init();

			await api.onEntriesUpdated([{_id: '1', name: 'first', __created: 1, __updated: 1, _v: 'v1'}]);
			await api.loadCache();
			const before = api.cache.all().length;

			await api.onEntriesUpdated([{_id: '1', name: 'updated', __created: 1, __updated: 2, _v: 'v1'}]);
			const after = api.cache.all();
			return {before, after, item: after.find((x: any) => x._id === '1')};
		});

		expect(result.before).toBe(1);
		expect(result.item?.name).toBe('updated');
	});

	test('onEntriesDeleted removes from IDB and cache', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi} = (window as any).DbApiFrontend;
			const api = new TestBaseApi();
			await api.init();

			await api.onEntriesUpdated([
				{_id: '1', name: 'a', __created: 1, __updated: 1, _v: 'v1'},
				{_id: '2', name: 'b', __created: 2, __updated: 2, _v: 'v1'}
			]);
			await api.loadCache();
			await api.onEntriesDeleted([{_id: '1', name: 'a', __created: 1, __updated: 1, _v: 'v1'}]);
			const all = api.cache.all();
			return {length: all.length, ids: all.map((x: any) => x._id)};
		});

		expect(result.length).toBe(1);
		expect(result.ids).toContain('2');
		expect(result.ids).not.toContain('1');
	});
});
