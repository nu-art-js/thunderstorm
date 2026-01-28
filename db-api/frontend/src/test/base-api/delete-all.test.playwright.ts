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
		await page.waitForFunction(() => (window as any).DbApiFrontend !== undefined);
		await page.evaluate(() => (window as any).DbApiFrontend.cleanupDbApiIDB());
	});

	test('deleteAll() completes without error', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi, __setTestHttpClientFactory} = (window as any).DbApiFrontend;
			__setTestHttpClientFactory(() => ({
				setUrlParams: () => {},
				setBodyAsJson: () => {},
				execute: () => Promise.resolve(undefined),
				getRawResponse: () => ({data: undefined, status: 200, statusText: 'OK', headers: {}, config: {}})
			}));
			const api = new TestBaseApi();
			await api.init();
			await api.deleteAll();
			__setTestHttpClientFactory(null);
			return {ok: true};
		});
		expect(result.ok).toBe(true);
	});
});
