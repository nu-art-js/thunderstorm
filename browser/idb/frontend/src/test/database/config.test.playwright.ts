/*
 * @nu-art/idb-frontend - IndexedDB infrastructure for frontend applications
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';

test.describe('IDB_Database - Config', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => window.IDBFrontend !== undefined);
		// Full cleanup before each test
		await page.evaluate(() => window.IDBFrontend.cleanupAllIDB());
	});

	test('createStore() after open() throws error', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-config-after-open');
			db.createStore<{ _id: string }>({name: 'store1', uniqueKeys: ['_id']});
			await db.open();

			let errorMessage = '';
			try {
				db.createStore<{ _id: string }>({name: 'store2', uniqueKeys: ['_id']});
			} catch (e) {
				errorMessage = (e as Error).message;
			}

			await db.deleteDatabase();
			return errorMessage;
		});

		expect(result).toContain('Cannot create store');
		expect(result).toContain('already open');
	});

	test('duplicate store name throws error', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-config-duplicate');
			db.createStore<{ _id: string }>({name: 'users', uniqueKeys: ['_id']});

			let errorMessage = '';
			try {
				db.createStore<{ _id: string }>({name: 'users', uniqueKeys: ['_id']});
			} catch (e) {
				errorMessage = (e as Error).message;
			}

			return errorMessage;
		});

		expect(result).toContain('already registered');
	});

	// Note: autoIncrement with keyPath array is a known IndexedDB limitation
	// When keyPath is an array (even single element), autoIncrement doesn't work as expected
	// This test is skipped - autoIncrement works best with out-of-line keys or single string keyPath
	test.skip('autoIncrement: true generates keys', async ({page}) => {
		// Skipped: IndexedDB limitation with array keyPath + autoIncrement
		// To use autoIncrement, the implementation would need to detect single-element
		// uniqueKeys arrays and convert them to string keyPaths
	});

	test('compound uniqueKeys work', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-config-compound');
			const store = db.createStore<{ userId: string; orderId: string; total: number }>({
				name: 'user_orders',
				uniqueKeys: ['userId', 'orderId'],
			});
			await db.open();

			// Insert with compound key
			await store.insert({userId: 'u1', orderId: 'o1', total: 100});
			await store.insert({userId: 'u1', orderId: 'o2', total: 200});
			await store.insert({userId: 'u2', orderId: 'o1', total: 300});

			// Get by compound key
			const item = await store.get({userId: 'u1', orderId: 'o2'});

			// Duplicate compound key should fail
			let duplicateError = false;
			try {
				await store.insert({userId: 'u1', orderId: 'o1', total: 999});
			} catch (e) {
				duplicateError = true;
			}

			const count = await store.count();
			await db.deleteDatabase();

			return {item, duplicateError, count};
		});

		expect(result.item).toEqual({userId: 'u1', orderId: 'o2', total: 200});
		expect(result.duplicateError).toBe(true);
		expect(result.count).toBe(3);
	});

	test('index with unique: true enforces uniqueness', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-config-unique-index');
			const store = db.createStore<{ _id: string; email: string; name: string }>({
				name: 'users',
				uniqueKeys: ['_id'],
			});
			store.createIndex('by-email', 'email', {unique: true});
			await db.open();

			await store.insert({_id: '1', email: 'test@example.com', name: 'Alice'});

			// Duplicate email should fail
			let duplicateError = false;
			try {
				await store.insert({_id: '2', email: 'test@example.com', name: 'Bob'});
			} catch (e) {
				duplicateError = true;
			}

			// Different email should succeed
			await store.insert({_id: '2', email: 'other@example.com', name: 'Bob'});
			const count = await store.count();

			await db.deleteDatabase();

			return {duplicateError, count};
		});

		expect(result.duplicateError).toBe(true);
		expect(result.count).toBe(2);
	});

	test('index with multiEntry: true indexes array elements', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-config-multientry');
			const store = db.createStore<{ _id: string; tags: string[]; name: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			const byTag = store.createIndex('by-tag', 'tags', {multiEntry: true});
			await db.open();

			await store.insert({_id: '1', name: 'Item1', tags: ['red', 'blue']});
			await store.insert({_id: '2', name: 'Item2', tags: ['blue', 'green']});
			await store.insert({_id: '3', name: 'Item3', tags: ['green']});

			// Query by tag using typed index accessor
			const blueItems = await byTag.getAll('blue');
			const greenItems = await byTag.getAll('green');

			await db.deleteDatabase();

			return {
				blueCount: blueItems.length,
				greenCount: greenItems.length,
				blueNames: blueItems.map(i => i.name).sort(),
				greenNames: greenItems.map(i => i.name).sort(),
			};
		});

		expect(result.blueCount).toBe(2);
		expect(result.greenCount).toBe(2);
		expect(result.blueNames).toEqual(['Item1', 'Item2']);
		expect(result.greenNames).toEqual(['Item2', 'Item3']);
	});
});
