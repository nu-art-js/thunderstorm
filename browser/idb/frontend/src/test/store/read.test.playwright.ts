/*
 * @nu-art/idb-frontend - IndexedDB infrastructure for frontend applications
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';

test.describe('IDB_Store - Read Operations', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => window.IDBFrontend !== undefined);
		await page.evaluate(() => window.IDBFrontend.cleanupAllIDB());
	});

	test('get() returns item by key', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-read-get');
			const store = db.createStore<{ _id: string; name: string; value: number }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			await store.insert({_id: '1', name: 'Test', value: 42});
			const item = await store.get({_id: '1'});
			await db.deleteDatabase();

			return item;
		});

		expect(result).toEqual({_id: '1', name: 'Test', value: 42});
	});

	test('get() returns undefined for non-existent key', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-read-get-undefined');
			const store = db.createStore<{ _id: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			const item = await store.get({_id: 'nonexistent'});
			await db.deleteDatabase();

			return item;
		});

		expect(result).toBeUndefined();
	});

	test('getAll() returns all items', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-read-getall');
			const store = db.createStore<{ _id: string; name: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			await store.insertAll([
				{_id: '1', name: 'One'},
				{_id: '2', name: 'Two'},
				{_id: '3', name: 'Three'},
			]);

			const all = await store.getAll();
			await db.deleteDatabase();

			return all;
		});

		expect(result).toHaveLength(3);
		expect(result).toContainEqual({_id: '1', name: 'One'});
		expect(result).toContainEqual({_id: '2', name: 'Two'});
		expect(result).toContainEqual({_id: '3', name: 'Three'});
	});

	test('getAll() returns empty array for empty store', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-read-getall-empty');
			const store = db.createStore<{ _id: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			const all = await store.getAll();
			await db.deleteDatabase();

			return all;
		});

		expect(result).toEqual([]);
	});

	test('count() returns item count', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-read-count');
			const store = db.createStore<{ _id: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			await store.insertAll([{_id: '1'}, {_id: '2'}, {_id: '3'}, {_id: '4'}]);

			const count = await store.count();
			await db.deleteDatabase();

			return count;
		});

		expect(result).toBe(4);
	});

	test('count() returns 0 for empty store', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-read-count-empty');
			const store = db.createStore<{ _id: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			const count = await store.count();
			await db.deleteDatabase();

			return count;
		});

		expect(result).toBe(0);
	});

	test('query() with limit', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-read-query-limit');
			const store = db.createStore<{ _id: string; name: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			await store.insertAll([
				{_id: '1', name: 'One'},
				{_id: '2', name: 'Two'},
				{_id: '3', name: 'Three'},
				{_id: '4', name: 'Four'},
				{_id: '5', name: 'Five'},
			]);

			const limited = await store.query({limit: 3});
			await db.deleteDatabase();

			return limited.length;
		});

		expect(result).toBe(3);
	});

	test('query via typed index accessor', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-read-query-index');
			const store = db.createStore<{ _id: string; category: string; name: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			const byCategory = store.createIndex('by-category', 'category');
			await db.open();

			await store.insertAll([
				{_id: '1', category: 'A', name: 'Item1'},
				{_id: '2', category: 'B', name: 'Item2'},
				{_id: '3', category: 'A', name: 'Item3'},
				{_id: '4', category: 'B', name: 'Item4'},
			]);

			const categoryA = await byCategory.getAll('A');
			await db.deleteDatabase();

			return categoryA;
		});

		expect(result).toHaveLength(2);
		expect(result).toContainEqual({_id: '1', category: 'A', name: 'Item1'});
		expect(result).toContainEqual({_id: '3', category: 'A', name: 'Item3'});
	});

	test('queryFilter() filters items', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-read-queryfilter');
			const store = db.createStore<{ _id: string; value: number }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			await store.insertAll([
				{_id: '1', value: 10},
				{_id: '2', value: 25},
				{_id: '3', value: 15},
				{_id: '4', value: 30},
				{_id: '5', value: 5},
			]);

			const filtered = await store.queryFilter(item => item.value >= 20);
			await db.deleteDatabase();

			return filtered;
		});

		expect(result).toHaveLength(2);
		expect(result).toContainEqual({_id: '2', value: 25});
		expect(result).toContainEqual({_id: '4', value: 30});
	});

	test('queryFilter() with limit stops early', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-read-queryfilter-limit');
			const store = db.createStore<{ _id: string; value: number }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			await store.insertAll([
				{_id: '1', value: 10},
				{_id: '2', value: 20},
				{_id: '3', value: 30},
				{_id: '4', value: 40},
				{_id: '5', value: 50},
			]);

			// All items pass filter, but limit to 2
			const filtered = await store.queryFilter(item => item.value >= 10, {limit: 2});
			await db.deleteDatabase();

			return filtered.length;
		});

		expect(result).toBe(2);
	});

	test('queryFind() returns first match', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-read-queryfind');
			const store = db.createStore<{ _id: string; name: string; active: boolean }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			await store.insertAll([
				{_id: '1', name: 'One', active: false},
				{_id: '2', name: 'Two', active: true},
				{_id: '3', name: 'Three', active: true},
			]);

			const found = await store.queryFind(item => item.active);
			await db.deleteDatabase();

			return found;
		});

		// Should find one of the active items (order not guaranteed)
		expect(result).toBeDefined();
		expect(result!.active).toBe(true);
	});

	test('queryFind() returns undefined if no match', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-read-queryfind-nomatch');
			const store = db.createStore<{ _id: string; value: number }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			await store.insertAll([
				{_id: '1', value: 10},
				{_id: '2', value: 20},
			]);

			const found = await store.queryFind(item => item.value > 100);
			await db.deleteDatabase();

			return found;
		});

		expect(result).toBeUndefined();
	});

	test('queryMap() transforms items', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-read-querymap');
			const store = db.createStore<{ _id: string; firstName: string; lastName: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			await store.insertAll([
				{_id: '1', firstName: 'John', lastName: 'Doe'},
				{_id: '2', firstName: 'Jane', lastName: 'Smith'},
			]);

			const fullNames = await store.queryMap(item => `${item.firstName} ${item.lastName}`);
			await db.deleteDatabase();

			return fullNames.sort();
		});

		expect(result).toEqual(['Jane Smith', 'John Doe']);
	});

	test('queryMap() with filter', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-read-querymap-filter');
			const store = db.createStore<{ _id: string; name: string; active: boolean }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			await store.insertAll([
				{_id: '1', name: 'Alice', active: true},
				{_id: '2', name: 'Bob', active: false},
				{_id: '3', name: 'Charlie', active: true},
			]);

			const activeNames = await store.queryMap(
				item => item.name,
				item => item.active
			);
			await db.deleteDatabase();

			return activeNames.sort();
		});

		expect(result).toEqual(['Alice', 'Charlie']);
	});

	test('queryReduce() aggregates values', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-read-queryreduce');
			const store = db.createStore<{ _id: string; amount: number }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			await store.insertAll([
				{_id: '1', amount: 10},
				{_id: '2', amount: 20},
				{_id: '3', amount: 30},
				{_id: '4', amount: 40},
			]);

			const sum = await store.queryReduce((acc, item) => acc + item.amount, 0);
			await db.deleteDatabase();

			return sum;
		});

		expect(result).toBe(100);
	});
});
