/*
 * @nu-art/idb-frontend - IndexedDB infrastructure for frontend applications
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';

test.describe('IDB_StoreIndex - Typed Index Accessor', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => window.IDBFrontend !== undefined);
		await page.evaluate(() => window.IDBFrontend.cleanupAllIDB());
	});

	test('createIndex() returns typed accessor', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-index-accessor');
			const store = db.createStore<{ _id: string; email: string; name: string }>({
				name: 'users',
				uniqueKeys: ['_id'],
			});

			const byEmail = store.createIndex('by-email', 'email');

			// Check the accessor properties
			const indexName = byEmail.name;
			const indexKeys = byEmail.indexKeys;

			await db.deleteDatabase();

			return {indexName, indexKeys};
		});

		expect(result.indexName).toBe('by-email');
		expect(result.indexKeys).toBe('email');
	});

	test('index.getAll() returns matching items', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-index-query');
			const store = db.createStore<{ _id: string; category: string; name: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			const byCategory = store.createIndex('by-category', 'category');
			await db.open();

			await store.insertAll([
				{_id: '1', category: 'Electronics', name: 'Phone'},
				{_id: '2', category: 'Books', name: 'Novel'},
				{_id: '3', category: 'Electronics', name: 'Laptop'},
				{_id: '4', category: 'Books', name: 'Comic'},
			]);

			const electronics = await byCategory.getAll('Electronics');
			const books = await byCategory.getAll('Books');

			await db.deleteDatabase();

			return {
				electronicsCount: electronics.length,
				booksCount: books.length,
				electronicsNames: electronics.map(i => i.name).sort(),
			};
		});

		expect(result.electronicsCount).toBe(2);
		expect(result.booksCount).toBe(2);
		expect(result.electronicsNames).toEqual(['Laptop', 'Phone']);
	});

	test('index.getAll() with limit', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-index-query-limit');
			const store = db.createStore<{ _id: string; category: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			const byCategory = store.createIndex('by-category', 'category');
			await db.open();

			await store.insertAll([
				{_id: '1', category: 'A'},
				{_id: '2', category: 'A'},
				{_id: '3', category: 'A'},
				{_id: '4', category: 'A'},
				{_id: '5', category: 'A'},
			]);

			const limited = await byCategory.getAll('A', 2);
			const all = await byCategory.getAll('A');

			await db.deleteDatabase();

			return {limitedCount: limited.length, allCount: all.length};
		});

		expect(result.limitedCount).toBe(2);
		expect(result.allCount).toBe(5);
	});

	test('index.get() returns first match or undefined', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-index-queryone');
			const store = db.createStore<{ _id: string; email: string; name: string }>({
				name: 'users',
				uniqueKeys: ['_id'],
			});
			const byEmail = store.createIndex('by-email', 'email', {unique: true});
			await db.open();

			await store.insert({_id: '1', email: 'alice@example.com', name: 'Alice'});

			const found = await byEmail.get('alice@example.com');
			const notFound = await byEmail.get('bob@example.com');

			await db.deleteDatabase();

			return {found, notFound};
		});

		expect(result.found).toEqual({_id: '1', email: 'alice@example.com', name: 'Alice'});
		expect(result.notFound).toBeUndefined();
	});

	test('index.count() returns count of matching items', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-index-count');
			const store = db.createStore<{ _id: string; status: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			const byStatus = store.createIndex('by-status', 'status');
			await db.open();

			await store.insertAll([
				{_id: '1', status: 'active'},
				{_id: '2', status: 'active'},
				{_id: '3', status: 'inactive'},
				{_id: '4', status: 'active'},
			]);

			const activeCount = await byStatus.count('active');
			const inactiveCount = await byStatus.count('inactive');
			const unknownCount = await byStatus.count('unknown');

			await db.deleteDatabase();

			return {activeCount, inactiveCount, unknownCount};
		});

		expect(result.activeCount).toBe(3);
		expect(result.inactiveCount).toBe(1);
		expect(result.unknownCount).toBe(0);
	});

	test('index.filter() applies filter to index results', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-index-queryfilter');
			const store = db.createStore<{ _id: string; category: string; price: number }>({
				name: 'products',
				uniqueKeys: ['_id'],
			});
			const byCategory = store.createIndex('by-category', 'category');
			await db.open();

			await store.insertAll([
				{_id: '1', category: 'Electronics', price: 100},
				{_id: '2', category: 'Electronics', price: 500},
				{_id: '3', category: 'Electronics', price: 200},
				{_id: '4', category: 'Books', price: 15},
			]);

			// Get electronics over $150
			const expensive = await byCategory.filter(
				'Electronics',
				item => item.price > 150
			);

			await db.deleteDatabase();

			return expensive;
		});

		expect(result).toHaveLength(2);
		expect(result).toContainEqual({_id: '2', category: 'Electronics', price: 500});
		expect(result).toContainEqual({_id: '3', category: 'Electronics', price: 200});
	});

	test('index.filter() with limit', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-index-queryfilter-limit');
			const store = db.createStore<{ _id: string; category: string; value: number }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			const byCategory = store.createIndex('by-category', 'category');
			await db.open();

			await store.insertAll([
				{_id: '1', category: 'A', value: 10},
				{_id: '2', category: 'A', value: 20},
				{_id: '3', category: 'A', value: 30},
				{_id: '4', category: 'A', value: 40},
			]);

			// Get category A items, filter all (pass), but limit to 2
			const limited = await byCategory.filter('A', () => true, 2);

			await db.deleteDatabase();

			return limited.length;
		});

		expect(result).toBe(2);
	});

	test('index.map() transforms index results', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-index-querymap');
			const store = db.createStore<{ _id: string; department: string; name: string; salary: number }>({
				name: 'employees',
				uniqueKeys: ['_id'],
			});
			const byDepartment = store.createIndex('by-department', 'department');
			await db.open();

			await store.insertAll([
				{_id: '1', department: 'Engineering', name: 'Alice', salary: 100000},
				{_id: '2', department: 'Engineering', name: 'Bob', salary: 90000},
				{_id: '3', department: 'Sales', name: 'Charlie', salary: 80000},
			]);

			// Get just names from engineering
			const engineeringNames = await byDepartment.map('Engineering', emp => emp.name);

			await db.deleteDatabase();

			return engineeringNames.sort();
		});

		expect(result).toEqual(['Alice', 'Bob']);
	});

	test('index.map() with filter', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-index-querymap-filter');
			const store = db.createStore<{ _id: string; type: string; name: string; active: boolean }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			const byType = store.createIndex('by-type', 'type');
			await db.open();

			await store.insertAll([
				{_id: '1', type: 'product', name: 'Widget', active: true},
				{_id: '2', type: 'product', name: 'Gadget', active: false},
				{_id: '3', type: 'product', name: 'Gizmo', active: true},
			]);

			// Get names of active products only
			const activeNames = await byType.map(
				'product',
				item => item.name,
				item => item.active
			);

			await db.deleteDatabase();

			return activeNames.sort();
		});

		expect(result).toEqual(['Gizmo', 'Widget']);
	});

	test('unique index enforces uniqueness', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-index-unique');
			const store = db.createStore<{ _id: string; email: string; name: string }>({
				name: 'users',
				uniqueKeys: ['_id'],
			});
			store.createIndex('by-email', 'email', {unique: true});
			await db.open();

			await store.insert({_id: '1', email: 'test@example.com', name: 'First'});

			let errorThrown = false;
			try {
				await store.insert({_id: '2', email: 'test@example.com', name: 'Second'});
			} catch (e) {
				errorThrown = true;
			}

			const count = await store.count();
			await db.deleteDatabase();

			return {errorThrown, count};
		});

		expect(result.errorThrown).toBe(true);
		expect(result.count).toBe(1);
	});

	test('multiEntry index indexes array elements', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-index-multientry');
			const store = db.createStore<{ _id: string; tags: string[]; name: string }>({
				name: 'articles',
				uniqueKeys: ['_id'],
			});
			const byTag = store.createIndex('by-tag', 'tags', {multiEntry: true});
			await db.open();

			await store.insertAll([
				{_id: '1', tags: ['javascript', 'typescript'], name: 'TS Guide'},
				{_id: '2', tags: ['python', 'machine-learning'], name: 'ML Basics'},
				{_id: '3', tags: ['javascript', 'react'], name: 'React Tutorial'},
			]);

			const jsArticles = await byTag.getAll('javascript');
			const pythonArticles = await byTag.getAll('python');

			await db.deleteDatabase();

			return {
				jsCount: jsArticles.length,
				pythonCount: pythonArticles.length,
				jsNames: jsArticles.map(a => a.name).sort(),
			};
		});

		expect(result.jsCount).toBe(2);
		expect(result.pythonCount).toBe(1);
		expect(result.jsNames).toEqual(['React Tutorial', 'TS Guide']);
	});

	test('multiple indices on same store', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-index-multiple');
			const store = db.createStore<{ _id: string; category: string; status: string; name: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			const byCategory = store.createIndex('by-category', 'category');
			const byStatus = store.createIndex('by-status', 'status');
			await db.open();

			await store.insertAll([
				{_id: '1', category: 'A', status: 'active', name: 'Item1'},
				{_id: '2', category: 'B', status: 'active', name: 'Item2'},
				{_id: '3', category: 'A', status: 'inactive', name: 'Item3'},
			]);

			const categoryA = await byCategory.getAll('A');
			const activeItems = await byStatus.getAll('active');

			await db.deleteDatabase();

			return {
				categoryACount: categoryA.length,
				activeCount: activeItems.length,
			};
		});

		expect(result.categoryACount).toBe(2);
		expect(result.activeCount).toBe(2);
	});

	test('getIndex() retrieves existing index', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-index-getindex');
			const store = db.createStore<{ _id: string; email: string }>({
				name: 'users',
				uniqueKeys: ['_id'],
			});
			const byEmail = store.createIndex('by-email', 'email');
			await db.open();

			// Get the index by name
			const retrieved = store.getIndex('by-email');
			const nonExistent = store.getIndex('non-existent');

			await db.deleteDatabase();

			return {
				retrieved: retrieved !== undefined,
				sameInstance: retrieved === byEmail,
				nonExistent: nonExistent === undefined,
			};
		});

		expect(result.retrieved).toBe(true);
		expect(result.sameInstance).toBe(true);
		expect(result.nonExistent).toBe(true);
	});

	test('duplicate index name throws error', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-index-duplicate');
			const store = db.createStore<{ _id: string; email: string; name: string }>({
				name: 'users',
				uniqueKeys: ['_id'],
			});

			store.createIndex('by-email', 'email');

			let errorMessage = '';
			try {
				store.createIndex('by-email', 'name');
			} catch (e) {
				errorMessage = (e as Error).message;
			}

			return errorMessage;
		});

		expect(result).toContain('already exists');
	});

	// ==================== Compound Key Tests ====================

	test('compound index with two keys', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-index-compound');
			const store = db.createStore<{ _id: string; category: string; status: string; name: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			const byCategoryStatus = store.createIndex('by-cat-status', ['category', 'status'] as const);
			await db.open();

			await store.insertAll([
				{_id: '1', category: 'Electronics', status: 'active', name: 'Phone'},
				{_id: '2', category: 'Electronics', status: 'inactive', name: 'Old Radio'},
				{_id: '3', category: 'Electronics', status: 'active', name: 'Laptop'},
				{_id: '4', category: 'Books', status: 'active', name: 'Novel'},
			]);

			// Query with compound key [category, status]
			const activeElectronics = await byCategoryStatus.getAll(['Electronics', 'active']);
			const inactiveElectronics = await byCategoryStatus.getAll(['Electronics', 'inactive']);
			const activeBooks = await byCategoryStatus.getAll(['Books', 'active']);

			await db.deleteDatabase();

			return {
				activeElectronicsCount: activeElectronics.length,
				activeElectronicsNames: activeElectronics.map(i => i.name).sort(),
				inactiveElectronicsCount: inactiveElectronics.length,
				activeBooksCount: activeBooks.length,
			};
		});

		expect(result.activeElectronicsCount).toBe(2);
		expect(result.activeElectronicsNames).toEqual(['Laptop', 'Phone']);
		expect(result.inactiveElectronicsCount).toBe(1);
		expect(result.activeBooksCount).toBe(1);
	});

	test('compound index get', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-index-compound-queryone');
			const store = db.createStore<{ _id: string; firstName: string; lastName: string; email: string }>({
				name: 'users',
				uniqueKeys: ['_id'],
			});
			const byFullName = store.createIndex('by-fullname', ['firstName', 'lastName'] as const);
			await db.open();

			await store.insertAll([
				{_id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com'},
				{_id: '2', firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com'},
				{_id: '3', firstName: 'John', lastName: 'Smith', email: 'jsmith@example.com'},
			]);

			const johnDoe = await byFullName.get(['John', 'Doe']);
			const nonExistent = await byFullName.get(['Bob', 'Builder']);

			await db.deleteDatabase();

			return {
				johnDoe,
				nonExistent,
			};
		});

		expect(result.johnDoe).toEqual({_id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com'});
		expect(result.nonExistent).toBeUndefined();
	});

	test('compound index count', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-index-compound-count');
			const store = db.createStore<{ _id: string; year: number; month: number; value: number }>({
				name: 'records',
				uniqueKeys: ['_id'],
			});
			const byYearMonth = store.createIndex('by-year-month', ['year', 'month'] as const);
			await db.open();

			await store.insertAll([
				{_id: '1', year: 2024, month: 1, value: 100},
				{_id: '2', year: 2024, month: 1, value: 200},
				{_id: '3', year: 2024, month: 2, value: 300},
				{_id: '4', year: 2025, month: 1, value: 400},
			]);

			const jan2024Count = await byYearMonth.count([2024, 1]);
			const feb2024Count = await byYearMonth.count([2024, 2]);
			const jan2025Count = await byYearMonth.count([2025, 1]);

			await db.deleteDatabase();

			return {jan2024Count, feb2024Count, jan2025Count};
		});

		expect(result.jan2024Count).toBe(2);
		expect(result.feb2024Count).toBe(1);
		expect(result.jan2025Count).toBe(1);
	});

	// ==================== find Tests ====================

	test('index.find() returns first match', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-index-queryfind');
			const store = db.createStore<{ _id: string; category: string; price: number; name: string }>({
				name: 'products',
				uniqueKeys: ['_id'],
			});
			const byCategory = store.createIndex('by-category', 'category');
			await db.open();

			await store.insertAll([
				{_id: '1', category: 'Electronics', price: 100, name: 'Cheap Phone'},
				{_id: '2', category: 'Electronics', price: 500, name: 'Expensive Phone'},
				{_id: '3', category: 'Electronics', price: 200, name: 'Mid Phone'},
			]);

			// Find first electronic over $300
			const expensive = await byCategory.find('Electronics', item => item.price > 300);
			const none = await byCategory.find('Electronics', item => item.price > 1000);

			await db.deleteDatabase();

			return {expensive, none};
		});

		expect(result.expensive).toEqual({_id: '2', category: 'Electronics', price: 500, name: 'Expensive Phone'});
		expect(result.none).toBeUndefined();
	});

	// ==================== reduce Tests ====================

	test('index.reduce() aggregates values', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-index-queryreduce');
			const store = db.createStore<{ _id: string; category: string; amount: number }>({
				name: 'transactions',
				uniqueKeys: ['_id'],
			});
			const byCategory = store.createIndex('by-category', 'category');
			await db.open();

			await store.insertAll([
				{_id: '1', category: 'Food', amount: 25},
				{_id: '2', category: 'Food', amount: 50},
				{_id: '3', category: 'Food', amount: 15},
				{_id: '4', category: 'Transport', amount: 100},
			]);

			// Sum all food expenses
			const foodTotal = await byCategory.reduce(
				'Food',
				(sum, item) => sum + item.amount,
				0
			);

			// Sum transport expenses
			const transportTotal = await byCategory.reduce(
				'Transport',
				(sum, item) => sum + item.amount,
				0
			);

			await db.deleteDatabase();

			return {foodTotal, transportTotal};
		});

		expect(result.foodTotal).toBe(90);
		expect(result.transportTotal).toBe(100);
	});

	test('index.reduce() with filter', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-index-queryreduce-filter');
			const store = db.createStore<{ _id: string; department: string; salary: number; active: boolean }>({
				name: 'employees',
				uniqueKeys: ['_id'],
			});
			const byDept = store.createIndex('by-department', 'department');
			await db.open();

			await store.insertAll([
				{_id: '1', department: 'Engineering', salary: 100000, active: true},
				{_id: '2', department: 'Engineering', salary: 90000, active: false},
				{_id: '3', department: 'Engineering', salary: 110000, active: true},
			]);

			// Sum salaries of active engineering employees only
			const activeEngSalary = await byDept.reduce(
				'Engineering',
				(sum, emp) => sum + emp.salary,
				0,
				emp => emp.active
			);

			await db.deleteDatabase();

			return activeEngSalary;
		});

		expect(result).toBe(210000);
	});
});
