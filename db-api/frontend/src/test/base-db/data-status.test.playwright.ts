/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';

test.describe('BaseDB - data status', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => (window as any).DbApiFrontend !== undefined);
		await page.evaluate(() => (window as any).DbApiFrontend.cleanupDbApiIDB());
	});

	test('getDataStatus after clearData is NoData', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi, HttpClient} = (window as any).DbApiFrontend;
			const client = new HttpClient();
			client.setConfig({origin: 'http://127.0.0.1'});
			const api = new TestBaseApi(client);
			await api.init();
			await api.onEntriesUpdated([{_id: '1', name: 'x', __created: 1, __updated: 1, _v: 'v1'}]);
			await api.loadCache();
			await api.clearData();
			const status = api.getDataStatus();
			return {status};
		});
		expect(result.status).toBe(0);
	});
});
