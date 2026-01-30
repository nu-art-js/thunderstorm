/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';

test.describe('BaseApi - validation on upsert', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => (window as _Window).DbApiFrontend !== undefined);
		await page.evaluate(() => (window as _Window).DbApiFrontend.cleanupDbApiIDB());
	});

	test('upsert with failing validator throws and cache unchanged', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApiValidation, HttpClient} = (window as _Window).DbApiFrontend;
			const client = new HttpClient();
			client.setConfig({origin: 'http://127.0.0.1'});
			(client as any).sendRequest = async () => ({data: {_id: '1', name: 'x', __created: 1, __updated: 1, _v: 'v1'}, status: 200, statusText: 'OK', headers: {}, config: {}});
			const api = new TestBaseApiValidation(client);
			await api.init();
			let thrown = false;
			try {
				await api.upsert({_id: '1', name: 'x'});
			} catch (_e) {
				thrown = true;
			}
			const cacheLength = api.cache.all().length;
			return {thrown, cacheLength};
		});
		expect(result.thrown).toBe(true);
		expect(result.cacheLength).toBe(0);
	});
});
