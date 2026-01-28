/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';

test.describe('BaseApi - upsertAll', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => (window as any).DbApiFrontend !== undefined);
		await page.evaluate(() => (window as any).DbApiFrontend.cleanupDbApiIDB());
	});

	test('upsertAll(body) and handleUpsertAllComplete', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi, __setTestHttpClientFactory} = (window as any).DbApiFrontend;
			const response = [
				{_id: '1', name: 'a', __created: 1, __updated: 1, _v: 'v1'},
				{_id: '2', name: 'b', __created: 2, __updated: 2, _v: 'v1'}
			];
			__setTestHttpClientFactory(() => ({
				setUrlParams: () => {},
				setBodyAsJson: () => {},
				execute: () => Promise.resolve(response),
				getRawResponse: () => ({data: response, status: 200, statusText: 'OK', headers: {}, config: {}})
			}));
			const api = new TestBaseApi();
			await api.init();
			await api.upsertAll([{_id: '1', name: 'a'}, {_id: '2', name: 'b'}]);
			const all = api.cache.all();
			__setTestHttpClientFactory(null);
			return {length: all.length};
		});
		expect(result.length).toBe(2);
	});
});
