/*
 * @nu-art/idb-frontend - IndexedDB infrastructure for frontend applications
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {test, expect} from '@playwright/test';
import {DBConfig} from '@nu-art/idb-shared';

type TestItem = {
	_id: string;
	name: string;
	value: number;
};

const dbConfig: DBConfig<TestItem> = {
	name: 'test-store',
	group: 'test-database',
	version: '1.0.0',
	autoIncrement: false,
	uniqueKeys: ['_id'],
	indices: []
};

// Test page path relative to package root (Vite runs from package directory)
const testPagePath = '/src/test/index.html';

test.describe('IDBManager - Browser Integration', () => {
	test.beforeEach(async ({page}) => {
		// Navigate to Vite-served test page
		await page.goto(testPagePath);
		// Wait for the module to load and expose IDBFrontend on window
		await page.waitForFunction(() => window.IDBFrontend !== undefined);
	});

	test('should register store and insert data', async ({page}) => {
		const result = await page.evaluate(async (config) => {
			const {IDBManager} = window.IDBFrontend;
			const store = IDBManager.register(config, async () => {
				console.log('Database opened');
			});

			const testItem = {_id: '1', name: 'Test Item', value: 100};
			const inserted = await store.insert(testItem);

			const retrieved = await store.get({_id: '1'});
			return {inserted, retrieved};
		}, dbConfig);

		expect(result.inserted).toEqual({_id: '1', name: 'Test Item', value: 100});
		expect(result.retrieved).toEqual({_id: '1', name: 'Test Item', value: 100});
	});

	test('should query data with filters', async ({page}) => {
		const result = await page.evaluate(async (config) => {
			const {IDBManager} = window.IDBFrontend;
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
		expect(result).toContainEqual({_id: '1', name: 'Item 1', value: 100});
		expect(result).toContainEqual({_id: '2', name: 'Item 2', value: 200});
		expect(result).toContainEqual({_id: '3', name: 'Item 3', value: 300});
	});

	test('should delete data', async ({page}) => {
		const result = await page.evaluate(async (config) => {
			const {IDBManager} = window.IDBFrontend;
			const store = IDBManager.register(config, async () => {
				console.log('Database opened');
			});

			// Insert item
			const inserted = await store.insert({_id: '1', name: 'Item 1', value: 100});

			// Delete item by key
			const deleted = await store.delete({_id: '1'});

			// Try to get deleted item
			const retrieved = await store.get({_id: '1'});

			return {inserted, deleted, retrieved};
		}, dbConfig);

		expect(result.inserted).toEqual({_id: '1', name: 'Item 1', value: 100});
		expect(result.deleted).toEqual({_id: '1', name: 'Item 1', value: 100});
		expect(result.retrieved).toBeUndefined();
	});

	test('should handle multiple stores in same database group', async ({page}) => {
		type StoreItem = {_id: string; name: string; value: number};

		const result = await page.evaluate(async () => {
			const {IDBManager} = window.IDBFrontend;
			const store1 = IDBManager.register<StoreItem>({
				name: 'store-1',
				group: 'shared-db',
				version: '1.0.0',
				autoIncrement: false,
				uniqueKeys: ['_id'],
				indices: []
			}, async () => {});

			const store2 = IDBManager.register<StoreItem>({
				name: 'store-2',
				group: 'shared-db',
				version: '1.0.0',
				autoIncrement: false,
				uniqueKeys: ['_id'],
				indices: []
			}, async () => {});

			const inserted1 = await store1.insert({_id: '1', name: 'Store 1 Item', value: 100});
			const inserted2 = await store2.insert({_id: '1', name: 'Store 2 Item', value: 200});

			const item1 = await store1.get({_id: '1'});
			const item2 = await store2.get({_id: '1'});

			return {inserted1, inserted2, item1, item2};
		});

		expect(result.inserted1).toEqual({_id: '1', name: 'Store 1 Item', value: 100});
		expect(result.inserted2).toEqual({_id: '1', name: 'Store 2 Item', value: 200});
		expect(result.item1).toEqual({_id: '1', name: 'Store 1 Item', value: 100});
		expect(result.item2).toEqual({_id: '1', name: 'Store 2 Item', value: 200});
	});
});
