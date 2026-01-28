/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';

test.describe('BaseApi - query', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => (window as any).DbApiFrontend !== undefined);
		await page.evaluate(() => (window as any).DbApiFrontend.cleanupDbApiIDB());
	});

	test('query(body) triggers request and handleQueryComplete updates cache/IDB', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi, __setTestHttpClientFactory} = (window as any).DbApiFrontend;
			const response = [{_id: '1', name: 'a', __created: 1, __updated: 1, _v: 'v1'}];
			__setTestHttpClientFactory(() => ({
				setUrlParams: () => {},
				setBodyAsJson: (b: any) => {},
				execute: () => Promise.resolve(response),
				getRawResponse: () => ({data: response, status: 200, statusText: 'OK', headers: {}, config: {}})
			}));
			const api = new TestBaseApi();
			await api.init();
			await api.query({});
			const all = api.cache.all();
			__setTestHttpClientFactory(null);
			return {length: all.length, first: all[0]};
		});
		expect(result.length).toBe(1);
		expect(result.first?.name).toBe('a');
	});
});
