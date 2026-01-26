/*
 * @nu-art/idb-frontend - IndexedDB infrastructure for frontend applications
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';

test.describe('IDB_Store - Delete Operations', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => window.IDBFrontend !== undefined);
		await page.evaluate(() => window.IDBFrontend.cleanupAllIDB());
	});

	test('delete() removes item and returns it', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-delete-return');
			const store = db.createStore<{ _id: string; name: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			await store.insert({_id: '1', name: 'ToDelete'});

			const deleted = await store.delete({_id: '1'});
			const afterDelete = await store.get({_id: '1'});
			const count = await store.count();

			await db.deleteDatabase();

			return {deleted, afterDelete, count};
		});

		expect(result.deleted).toEqual({_id: '1', name: 'ToDelete'});
		expect(result.afterDelete).toBeUndefined();
		expect(result.count).toBe(0);
	});

	test('delete() non-existent key returns undefined', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-delete-nonexistent');
			const store = db.createStore<{ _id: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			const deleted = await store.delete({_id: 'nonexistent'});
			await db.deleteDatabase();

			return deleted;
		});

		expect(result).toBeUndefined();
	});

	test('deleteAll() batch delete', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-deleteall');
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
			]);

			const beforeCount = await store.count();

			// Delete items 1 and 3
			const deleted = await store.deleteAll([{_id: '1'}, {_id: '3'}]);

			const afterCount = await store.count();
			const remaining = await store.getAll();

			await db.deleteDatabase();

			return {beforeCount, afterCount, deleted, remaining};
		});

		expect(result.beforeCount).toBe(4);
		expect(result.afterCount).toBe(2);
		expect(result.deleted).toHaveLength(2);
		expect(result.deleted).toContainEqual({_id: '1', name: 'One'});
		expect(result.deleted).toContainEqual({_id: '3', name: 'Three'});
		expect(result.remaining).toContainEqual({_id: '2', name: 'Two'});
		expect(result.remaining).toContainEqual({_id: '4', name: 'Four'});
	});

	test('clearStore() removes all items', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-clearstore');
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

			const beforeCount = await store.count();
			await store.clearStore();
			const afterCount = await store.count();

			await db.deleteDatabase();

			return {beforeCount, afterCount};
		});

		expect(result.beforeCount).toBe(3);
		expect(result.afterCount).toBe(0);
	});

	test('clearAll() clears store data + sync metadata', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-clearall');
			const store = db.createStore<{ _id: string; name: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			// Insert data
			await store.insertAll([{_id: '1', name: 'One'}, {_id: '2', name: 'Two'}]);

			// Set sync metadata
			store.setLastSync(12345);
			store.setLastVersion('v1.0');

			const beforeCount = await store.count();
			const beforeSync = store.getLastSync();
			const beforeVersion = store.getLastVersion();

			// Clear all
			await store.clearAll();

			const afterCount = await store.count();
			const afterSync = store.getLastSync();
			const afterVersion = store.getLastVersion();

			await db.deleteDatabase();

			return {
				beforeCount,
				beforeSync,
				beforeVersion,
				afterCount,
				afterSync,
				afterVersion,
			};
		});

		expect(result.beforeCount).toBe(2);
		expect(result.beforeSync).toBe(12345);
		expect(result.beforeVersion).toBe('v1.0');
		expect(result.afterCount).toBe(0);
		expect(result.afterSync).toBe(0); // Default value when not set
		expect(result.afterVersion).toBeNull();
	});
});
