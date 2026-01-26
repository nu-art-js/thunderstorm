/*
 * @nu-art/idb-frontend - IndexedDB infrastructure for frontend applications
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';

test.describe('IDB_Database - Lifecycle', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => window.IDBFrontend !== undefined);
		// Full cleanup before each test
		await page.evaluate(() => window.IDBFrontend.cleanupAllIDB());
	});

	test('open() returns database instance', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-lifecycle-db');
			db.createStore<{ _id: string }>({name: 'store1', uniqueKeys: ['_id']});

			const instance = await db.open();

			// Check it returns the same instance
			const isInstance = instance === db;
			await db.deleteDatabase();

			return isInstance;
		});

		expect(result).toBe(true);
	});

	test('open() twice returns same instance (idempotent)', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-lifecycle-idempotent');
			db.createStore<{ _id: string }>({name: 'store1', uniqueKeys: ['_id']});

			const instance1 = await db.open();
			const instance2 = await db.open();

			const sameInstance = instance1 === instance2;
			await db.deleteDatabase();

			return sameInstance;
		});

		expect(result).toBe(true);
	});

	test('concurrent open() calls share same promise', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-lifecycle-concurrent');
			db.createStore<{ _id: string }>({name: 'store1', uniqueKeys: ['_id']});

			// Fire 3 concurrent opens
			const [instance1, instance2, instance3] = await Promise.all([
				db.open(),
				db.open(),
				db.open(),
			]);

			const allSame = instance1 === instance2 && instance2 === instance3;
			await db.deleteDatabase();

			return allSame;
		});

		expect(result).toBe(true);
	});

	test('close() closes connection', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-lifecycle-close');
			const store = db.createStore<{ _id: string; value: number }>({name: 'items', uniqueKeys: ['_id']});

			await db.open();
			await store.insert({_id: '1', value: 42});
			db.close();

			// After close, we should be able to re-open and data persists
			const db2 = new IDB_Database('test-lifecycle-close');
			const store2 = db2.createStore<{ _id: string; value: number }>({name: 'items', uniqueKeys: ['_id']});
			await db2.open();

			const item = await store2.get({_id: '1'});
			await db2.deleteDatabase();

			return item;
		});

		expect(result).toEqual({_id: '1', value: 42});
	});

	test('deleteDatabase() removes DB and localStorage registry', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-lifecycle-delete');
			const store = db.createStore<{ _id: string }>({name: 'items', uniqueKeys: ['_id']});
			await db.open();
			await store.insert({_id: '1'});

			// Check localStorage has registry
			const registryKey = 'idb-stores--test-lifecycle-delete';
			const hasRegistryBefore = localStorage.getItem(registryKey) !== null;

			await db.deleteDatabase();

			// Check localStorage registry is removed
			const hasRegistryAfter = localStorage.getItem(registryKey) !== null;

			// Check database is truly deleted by opening fresh
			const db2 = new IDB_Database('test-lifecycle-delete');
			const store2 = db2.createStore<{ _id: string }>({name: 'items', uniqueKeys: ['_id']});
			await db2.open();
			const item = await store2.get({_id: '1'});
			await db2.deleteDatabase();

			return {hasRegistryBefore, hasRegistryAfter, itemAfterDelete: item};
		});

		expect(result.hasRegistryBefore).toBe(true);
		expect(result.hasRegistryAfter).toBe(false);
		expect(result.itemAfterDelete).toBeUndefined();
	});

	test('getStore() returns registered store by name', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-lifecycle-getstore');
			const store = db.createStore<{ _id: string; name: string }>({name: 'users', uniqueKeys: ['_id']});
			await db.open();

			const retrievedStore = db.getStore<{ _id: string; name: string }>('users');
			const isCorrectStore = retrievedStore === store;

			// Verify it works
			await store.insert({_id: '1', name: 'Test'});
			const item = await retrievedStore!.get({_id: '1'});

			await db.deleteDatabase();

			return {isCorrectStore, item};
		});

		expect(result.isCorrectStore).toBe(true);
		expect(result.item).toEqual({_id: '1', name: 'Test'});
	});

	test('getStore() returns undefined for non-existing store', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-lifecycle-getstore-undefined');
			db.createStore<{ _id: string }>({name: 'users', uniqueKeys: ['_id']});
			await db.open();

			const nonExistent = db.getStore('nonexistent');
			await db.deleteDatabase();

			return nonExistent;
		});

		expect(result).toBeUndefined();
	});

	test('storeExists() returns true for existing store', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-lifecycle-exists-true');
			db.createStore<{ _id: string }>({name: 'users', uniqueKeys: ['_id']});
			await db.open();

			const exists = await db.storeExists('users');
			await db.deleteDatabase();

			return exists;
		});

		expect(result).toBe(true);
	});

	test('storeExists() returns false for non-existing store', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-lifecycle-exists-false');
			db.createStore<{ _id: string }>({name: 'users', uniqueKeys: ['_id']});
			await db.open();

			const exists = await db.storeExists('nonexistent');
			await db.deleteDatabase();

			return exists;
		});

		expect(result).toBe(false);
	});
});
