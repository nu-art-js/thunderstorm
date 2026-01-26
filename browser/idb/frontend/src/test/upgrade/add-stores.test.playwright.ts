/*
 * @nu-art/idb-frontend - IndexedDB infrastructure for frontend applications
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';

test.describe('IDB_Database - Add Stores Upgrade', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => window.IDBFrontend !== undefined);
		await page.evaluate(() => window.IDBFrontend.cleanupAllIDB());
	});

	test('add single new store - existing data persists', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			// Session 1: Create database with one store
			const db1 = new IDB_Database('test-upgrade-add-single');
			const store1 = db1.createStore<{ _id: string; name: string }>({
				name: 'store1',
				uniqueKeys: ['_id'],
			});
			await db1.open();
			await store1.insert({_id: '1', name: 'Item from store1'});
			db1.close();

			// Session 2: Open same database with additional store
			const db2 = new IDB_Database('test-upgrade-add-single');
			const store1Again = db2.createStore<{ _id: string; name: string }>({
				name: 'store1',
				uniqueKeys: ['_id'],
			});
			const store2 = db2.createStore<{ _id: string; value: number }>({
				name: 'store2',
				uniqueKeys: ['_id'],
			});
			await db2.open();

			// Verify store1 data persisted
			const fromStore1 = await store1Again.get({_id: '1'});

			// Verify store2 is usable
			await store2.insert({_id: '2', value: 99});
			const fromStore2 = await store2.get({_id: '2'});

			// Verify both stores exist
			const store1Exists = await db2.storeExists('store1');
			const store2Exists = await db2.storeExists('store2');

			await db2.deleteDatabase();

			return {fromStore1, fromStore2, store1Exists, store2Exists};
		});

		expect(result.fromStore1).toEqual({_id: '1', name: 'Item from store1'});
		expect(result.fromStore2).toEqual({_id: '2', value: 99});
		expect(result.store1Exists).toBe(true);
		expect(result.store2Exists).toBe(true);
	});

	test('add multiple new stores at once', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			// Session 1: Create database with one store
			const db1 = new IDB_Database('test-upgrade-add-multiple');
			const users = db1.createStore<{ _id: string; name: string }>({
				name: 'users',
				uniqueKeys: ['_id'],
			});
			await db1.open();
			await users.insert({_id: 'u1', name: 'Alice'});
			db1.close();

			// Session 2: Add three more stores
			const db2 = new IDB_Database('test-upgrade-add-multiple');
			const usersAgain = db2.createStore<{ _id: string; name: string }>({
				name: 'users',
				uniqueKeys: ['_id'],
			});
			const orders = db2.createStore<{ _id: string; total: number }>({
				name: 'orders',
				uniqueKeys: ['_id'],
			});
			const products = db2.createStore<{ _id: string; price: number }>({
				name: 'products',
				uniqueKeys: ['_id'],
			});
			const settings = db2.createStore<{ key: string; value: string }>({
				name: 'settings',
				uniqueKeys: ['key'],
			});
			await db2.open();

			// Verify original data persists
			const user = await usersAgain.get({_id: 'u1'});

			// Insert into new stores
			await orders.insert({_id: 'o1', total: 100});
			await products.insert({_id: 'p1', price: 25});
			await settings.insert({key: 'theme', value: 'dark'});

			// Verify all stores work
			const order = await orders.get({_id: 'o1'});
			const product = await products.get({_id: 'p1'});
			const setting = await settings.get({key: 'theme'});

			await db2.deleteDatabase();

			return {user, order, product, setting};
		});

		expect(result.user).toEqual({_id: 'u1', name: 'Alice'});
		expect(result.order).toEqual({_id: 'o1', total: 100});
		expect(result.product).toEqual({_id: 'p1', price: 25});
		expect(result.setting).toEqual({key: 'theme', value: 'dark'});
	});

	test('add store with indices triggers upgrade', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			// Session 1: Create database with simple store
			const db1 = new IDB_Database('test-upgrade-add-indexed');
			const items = db1.createStore<{ _id: string; category: string; name: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db1.open();
			await items.insert({_id: '1', category: 'A', name: 'Item1'});
			db1.close();

			// Get registry before adding new store
			const registryBefore = JSON.parse(localStorage.getItem('idb-stores--test-upgrade-add-indexed') || '{}');

			// Session 2: Add store with index
			const db2 = new IDB_Database('test-upgrade-add-indexed');
			const itemsAgain = db2.createStore<{ _id: string; category: string; name: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			const products = db2.createStore<{ _id: string; category: string; price: number }>({
				name: 'products',
				uniqueKeys: ['_id'],
			});
			const byCategory = products.createIndex('by-category', 'category');
			await db2.open();

			// Get registry after upgrade
			const registryAfter = JSON.parse(localStorage.getItem('idb-stores--test-upgrade-add-indexed') || '{}');

			// Insert products and query by index
			await products.insert({_id: 'p1', category: 'Electronics', price: 100});
			await products.insert({_id: 'p2', category: 'Electronics', price: 200});
			await products.insert({_id: 'p3', category: 'Books', price: 15});

			const electronics = await byCategory.getAll('Electronics');

			// Verify original data persists
			const item = await itemsAgain.get({_id: '1'});

			await db2.deleteDatabase();

			return {
				versionBefore: registryBefore.version,
				versionAfter: registryAfter.version,
				electronicsCount: electronics.length,
				item,
			};
		});

		expect(result.versionAfter).toBeGreaterThan(result.versionBefore);
		expect(result.electronicsCount).toBe(2);
		expect(result.item).toEqual({_id: '1', category: 'A', name: 'Item1'});
	});

	test('registry version increments with each upgrade', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;
			const versions: number[] = [];

			// Session 1: Initial
			const db1 = new IDB_Database('test-upgrade-version-tracking');
			db1.createStore<{ _id: string }>({name: 'store1', uniqueKeys: ['_id']});
			await db1.open();
			versions.push(JSON.parse(localStorage.getItem('idb-stores--test-upgrade-version-tracking') || '{}').version);
			db1.close();

			// Session 2: Add store2
			const db2 = new IDB_Database('test-upgrade-version-tracking');
			db2.createStore<{ _id: string }>({name: 'store1', uniqueKeys: ['_id']});
			db2.createStore<{ _id: string }>({name: 'store2', uniqueKeys: ['_id']});
			await db2.open();
			versions.push(JSON.parse(localStorage.getItem('idb-stores--test-upgrade-version-tracking') || '{}').version);
			db2.close();

			// Session 3: Add store3
			const db3 = new IDB_Database('test-upgrade-version-tracking');
			db3.createStore<{ _id: string }>({name: 'store1', uniqueKeys: ['_id']});
			db3.createStore<{ _id: string }>({name: 'store2', uniqueKeys: ['_id']});
			db3.createStore<{ _id: string }>({name: 'store3', uniqueKeys: ['_id']});
			await db3.open();
			versions.push(JSON.parse(localStorage.getItem('idb-stores--test-upgrade-version-tracking') || '{}').version);

			await db3.deleteDatabase();

			return versions;
		});

		// Version should increment with each new store
		expect(result[0]).toBe(1);
		expect(result[1]).toBe(2);
		expect(result[2]).toBe(3);
	});
});
