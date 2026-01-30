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

/** Map DBConfig to store setup: get db, create store, open. Used inside page.evaluate. */
function useStoreFromConfig(config: DBConfig<TestItem>) {
	return {
		dbName: config.group,
		storeConfig: {name: config.name, uniqueKeys: config.uniqueKeys, autoIncrement: config.autoIncrement}
	};
}

test.describe('IDBManager - Browser Integration', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => window.IDBFrontend !== undefined);
		await page.evaluate(() => window.IDBFrontend.cleanupAllIDB());
	});

	test('should register store and insert data', async ({page}) => {
		const {dbName, storeConfig} = useStoreFromConfig(dbConfig);
		const result = await page.evaluate(async (args: { dbName: string; storeConfig: { name: string; uniqueKeys: string[]; autoIncrement?: boolean } }) => {
			const {IDB_Database} = window.IDBFrontend;
			const db = new IDB_Database(args.dbName);
			const store = db.createStore<{ _id: string; name: string; value: number }>(args.storeConfig, async () => {
				console.log('Database opened');
			});
			await db.open();

			const testItem = {_id: '1', name: 'Test Item', value: 100};
			const inserted = await store.insert(testItem);

			const retrieved = await store.get({_id: '1'});
			await db.deleteDatabase();
			return {inserted, retrieved};
		}, {dbName, storeConfig});

		expect(result.inserted).toEqual({_id: '1', name: 'Test Item', value: 100});
		expect(result.retrieved).toEqual({_id: '1', name: 'Test Item', value: 100});
	});

	test('should query data with filters', async ({page}) => {
		const {dbName, storeConfig} = useStoreFromConfig(dbConfig);
		const result = await page.evaluate(async (args: { dbName: string; storeConfig: { name: string; uniqueKeys: string[]; autoIncrement?: boolean } }) => {
			const {IDB_Database} = window.IDBFrontend;
			const db = new IDB_Database(args.dbName);
			const store = db.createStore<{ _id: string; name: string; value: number }>(args.storeConfig, async () => {
				console.log('Database opened');
			});
			await db.open();

			await store.insert({_id: '1', name: 'Item 1', value: 100});
			await store.insert({_id: '2', name: 'Item 2', value: 200});
			await store.insert({_id: '3', name: 'Item 3', value: 300});

			const allItems = await store.getAll();
			await db.deleteDatabase();
			return allItems;
		}, {dbName, storeConfig});

		expect(result).toBeInstanceOf(Array);
		expect(result).toHaveLength(3);
		expect(result).toContainEqual({_id: '1', name: 'Item 1', value: 100});
		expect(result).toContainEqual({_id: '2', name: 'Item 2', value: 200});
		expect(result).toContainEqual({_id: '3', name: 'Item 3', value: 300});
	});

	test('should delete data', async ({page}) => {
		const {dbName, storeConfig} = useStoreFromConfig(dbConfig);
		const result = await page.evaluate(async (args: { dbName: string; storeConfig: { name: string; uniqueKeys: string[]; autoIncrement?: boolean } }) => {
			const {IDB_Database} = window.IDBFrontend;
			const db = new IDB_Database(args.dbName);
			const store = db.createStore<{ _id: string; name: string; value: number }>(args.storeConfig, async () => {
				console.log('Database opened');
			});
			await db.open();

			const inserted = await store.insert({_id: '1', name: 'Item 1', value: 100});

			const deleted = await store.delete({_id: '1'});

			const retrieved = await store.get({_id: '1'});
			await db.deleteDatabase();
			return {inserted, deleted, retrieved};
		}, {dbName, storeConfig});

		expect(result.inserted).toEqual({_id: '1', name: 'Item 1', value: 100});
		expect(result.deleted).toEqual({_id: '1', name: 'Item 1', value: 100});
		expect(result.retrieved).toBeUndefined();
	});

	test('should handle multiple stores in same database group', async ({page}) => {
		type StoreItem = {_id: string; name: string; value: number};
		const result = await page.evaluate(async () => {
			const {getDatabase} = window.IDBFrontend;
			const db = getDatabase('shared-db');
			const store1 = db.createStore<StoreItem>({
				name: 'store-1',
				uniqueKeys: ['_id'],
			}, async () => {});
			const store2 = db.createStore<StoreItem>({
				name: 'store-2',
				uniqueKeys: ['_id'],
			}, async () => {});
			await db.open();

			const inserted1 = await store1.insert({_id: '1', name: 'Store 1 Item', value: 100});
			const inserted2 = await store2.insert({_id: '1', name: 'Store 2 Item', value: 200});

			const item1 = await store1.get({_id: '1'});
			const item2 = await store2.get({_id: '1'});

			await db.deleteDatabase();
			return {inserted1, inserted2, item1, item2};
		});

		expect(result.inserted1).toEqual({_id: '1', name: 'Store 1 Item', value: 100});
		expect(result.inserted2).toEqual({_id: '1', name: 'Store 2 Item', value: 200});
		expect(result.item1).toEqual({_id: '1', name: 'Store 1 Item', value: 100});
		expect(result.item2).toEqual({_id: '1', name: 'Store 2 Item', value: 200});
	});
});
