/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';

test.describe('BaseApi - delete', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => (window as _Window).DbApiFrontend !== undefined);
		await page.evaluate(() => (window as _Window).DbApiFrontend.cleanupDbApiIDB());
	});

	test('deleteUnique(params) and handleDeleteComplete → onEntryDeleted', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi, HttpClient} = (window as _Window).DbApiFrontend;
			const deleted = {_id: '1', name: 'gone', __created: 1, __updated: 1, _v: 'v1'};
			const client = new HttpClient();
			client.setConfig({origin: 'http://127.0.0.1'});
			(client as any).sendRequest = async () => ({data: deleted, status: 200, statusText: 'OK', headers: {}, config: {}} as any);
			const api = new TestBaseApi(client);
			await api.init();
			await api.onEntriesUpdated([deleted]);
			await api.loadCache();
			const before = api.cache.all().length;
			await api.deleteUnique({_id: '1'});
			const all = api.cache.all();
			return {before, length: all.length, items: all};
		});
		console.log('delete items before:', result.before, 'items:', JSON.stringify(result.items));
		expect(result.before).toBe(1);
		expect(result.length).toBe(0);
	});
});
