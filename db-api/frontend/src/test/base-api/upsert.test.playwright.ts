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
		await page.waitForFunction(() => (window as any).DbApiFrontend !== undefined);
		await page.evaluate(() => (window as any).DbApiFrontend.cleanupDbApiIDB());
	});

	test('upsert(body) sends request body, handleUpsertComplete calls onEntryUpdated', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi, __setTestHttpClientFactory} = (window as any).DbApiFrontend;
			const response = {_id: '1', name: 'upserted', __created: 1, __updated: 2, _v: 'v1'};
			__setTestHttpClientFactory(() => ({
				setUrlParams: () => {},
				setBodyAsJson: () => {},
				execute: () => Promise.resolve(response),
				getRawResponse: () => ({data: response, status: 200, statusText: 'OK', headers: {}, config: {}})
			}));
			const api = new TestBaseApi();
			await api.init();
			await api.upsert({_id: '1', name: 'upserted'});
			const all = api.cache.all();
			__setTestHttpClientFactory(null);
			return {length: all.length, item: all[0]};
		});
		expect(result.length).toBe(1);
		expect(result.item?.name).toBe('upserted');
	});
});
