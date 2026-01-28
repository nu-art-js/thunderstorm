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
		await page.waitForFunction(() => (window as any).DbApiFrontend !== undefined);
		await page.evaluate(() => (window as any).DbApiFrontend.cleanupDbApiIDB());
	});

	test('delete(params) and handleDeleteComplete → onEntryDeleted', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi, __setTestHttpClientFactory} = (window as any).DbApiFrontend;
			const deleted = {_id: '1', name: 'gone', __created: 1, __updated: 1, _v: 'v1'};
			__setTestHttpClientFactory(() => ({
				setUrlParams: () => {},
				setBodyAsJson: () => {},
				execute: () => Promise.resolve(deleted),
				getRawResponse: () => ({data: deleted, status: 200, statusText: 'OK', headers: {}, config: {}})
			}));
			const api = new TestBaseApi();
			await api.init();
			await api.onEntriesUpdated([deleted]);
			await api.loadCache();
			const before = api.cache.all().length;
			await api.delete({_id: '1'});
			const all = api.cache.all();
			__setTestHttpClientFactory(null);
			return {before, length: all.length};
		});
		expect(result.before).toBe(1);
		expect(result.length).toBe(0);
	});
});
