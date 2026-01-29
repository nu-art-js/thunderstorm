/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';

test.describe('BaseApi - deleteAll', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => (window as _Window).DbApiFrontend !== undefined);
		await page.evaluate(() => (window as _Window).DbApiFrontend.cleanupDbApiIDB());
	});

	test('deleteAll() completes without error', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi, HttpClient} = (window as _Window).DbApiFrontend;
			const client = new HttpClient();
			client.setConfig({origin: 'http://127.0.0.1'});
			(client as any).sendRequest = async () => ({data: undefined, status: 200, statusText: 'OK', headers: {}, config: {}} as any);
			const api = new TestBaseApi(client);
			await api.init();
			await api.deleteAll();
			return {ok: true};
		});
		expect(result.ok).toBe(true);
	});
});
