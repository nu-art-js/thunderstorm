/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';

test.describe('BaseApi - upsert', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => (window as _Window).DbApiFrontend !== undefined);
		await page.evaluate(() => (window as _Window).DbApiFrontend.cleanupDbApiIDB());
	});

	test('upsert(body) sends request body, handleUpsertComplete calls onEntryUpdated', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi, HttpClient} = (window as _Window).DbApiFrontend;
			const response = {_id: '1', name: 'upserted', __created: 1, __updated: 2, _v: 'v1'};
			const client = new HttpClient();
			debugger;
			client.setConfig({origin: 'http://127.0.0.1'});
			(client as any).sendRequest = async () => ({data: response, status: 200, statusText: 'OK', headers: {}, config: {}} as any);
			const api = new TestBaseApi(client);
			await api.init();
			await api.upsert({_id: '1', name: 'upserted'});
			const all = api.cache.all();
			return {length: all.length, item: all[0], items: all};
		});

		console.log('upsert items:', JSON.stringify(result.items));
		expect(result.length).toBe(1);
		expect(result.item?.name).toBe('upserted');
	});
});
