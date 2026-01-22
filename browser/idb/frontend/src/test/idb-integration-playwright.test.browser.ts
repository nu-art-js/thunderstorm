/*
 * @nu-art/idb-frontend - IndexedDB infrastructure for frontend applications
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 *
 * This test file demonstrates Option A: Using Playwright's test runner (@playwright/test)
 * Compare with idb-integration.test.browser.ts which uses Option B: mocha + playwright library
 */

import {test, expect} from '@playwright/test';
import {DBConfig} from '@nu-art/idb-shared';
import {DBProto} from '@nu-art/ts-common';

type TestItem = {
	_id: string;
	name: string;
	value: number;
};

type TestProto = DBProto<{
	type: TestItem;
	dbKey: 'test-db';
	generatedKeys: '_id';
	versions: { current: '1.0.0' };
	uniqueKeys: '_id';
}>;

const dbConfig: DBConfig<TestProto> = {
	name: 'test-store',
	group: 'test-database',
	version: '1.0.0',
	autoIncrement: false,
	uniqueKeys: ['_id'],
	indices: []
};

test.describe('IDBManager - Browser Integration (Playwright Test Runner)', () => {
	test('should register store and insert data', async ({page}) => {
		// Load the bundled IDB code into browser context
		// Note: This requires the code to be built first (dist/index.js)
		await page.addScriptTag({path: './dist/index.js'});

		const result = await page.evaluate(async (config) => {
			// @ts-ignore - IDBManager is now available in browser context
			const store = IDBManager.register(config, async () => {
				console.log('Database opened');
			});

			const testItem = {_id: '1', name: 'Test Item', value: 100};
			await store.insert(testItem);

			const retrieved = await store.get({_id: '1'});
			return retrieved;
		}, dbConfig);

		expect(result).toEqual({_id: '1', name: 'Test Item', value: 100});
	});

	test('should query data with filters', async ({page}) => {
		await page.addScriptTag({path: './dist/index.js'});

		const result = await page.evaluate(async (config) => {
			// @ts-ignore
			const store = IDBManager.register(config, async () => {
				console.log('Database opened');
			});

			// Insert multiple items
			await store.insert({_id: '1', name: 'Item 1', value: 100});
			await store.insert({_id: '2', name: 'Item 2', value: 200});
			await store.insert({_id: '3', name: 'Item 3', value: 300});

			// Query all items
			const allItems = await store.query({});
			return allItems;
		}, dbConfig);

		expect(result).toBeInstanceOf(Array);
		expect(result).toHaveLength(3);
	});

	test('should delete data', async ({page}) => {
		await page.addScriptTag({path: './dist/index.js'});

		const result = await page.evaluate(async (config) => {
			// @ts-ignore
			const store = IDBManager.register(config, async () => {
				console.log('Database opened');
			});

			// Insert item
			await store.insert({_id: '1', name: 'Item 1', value: 100});

			// Delete item
			const deleted = await store.delete({_id: '1'});

			// Try to get deleted item
			const retrieved = await store.get({_id: '1'});

			return {deleted, retrieved};
		}, dbConfig);

		expect(result.deleted).toEqual({_id: '1', name: 'Item 1', value: 100});
		expect(result.retrieved).toBeUndefined();
	});

	test('should handle multiple stores in same database group', async ({page}) => {
		await page.addScriptTag({path: './dist/index.js'});

		const result = await page.evaluate(async () => {
			// @ts-ignore
			const store1 = IDBManager.register({
				name: 'store-1',
				group: 'shared-db',
				version: '1.0.0',
				autoIncrement: false,
				uniqueKeys: ['_id'],
				indices: []
			}, async () => {});

			// @ts-ignore
			const store2 = IDBManager.register({
				name: 'store-2',
				group: 'shared-db',
				version: '1.0.0',
				autoIncrement: false,
				uniqueKeys: ['_id'],
				indices: []
			}, async () => {});

			await store1.insert({_id: '1', name: 'Store 1 Item', value: 100});
			await store2.insert({_id: '1', name: 'Store 2 Item', value: 200});

			const item1 = await store1.get({_id: '1'});
			const item2 = await store2.get({_id: '1'});

			return {item1, item2};
		});

		expect(result.item1).toEqual({_id: '1', name: 'Store 1 Item', value: 100});
		expect(result.item2).toEqual({_id: '1', name: 'Store 2 Item', value: 200});
	});
});
