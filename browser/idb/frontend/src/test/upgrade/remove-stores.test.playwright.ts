/*
 * @nu-art/idb-frontend - IndexedDB infrastructure for frontend applications
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';

test.describe('IDB_Database - Remove Stores Upgrade', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => window.IDBFrontend !== undefined);
		await page.evaluate(() => window.IDBFrontend.cleanupAllIDB());
	});

	test('store not registered remains in IDB but inaccessible via API', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			// Session 1: Create database with two stores
			const db1 = new IDB_Database('test-upgrade-remove');
			const store1 = db1.createStore<{ _id: string; name: string }>({
				name: 'store1',
				uniqueKeys: ['_id'],
			});
			const store2 = db1.createStore<{ _id: string; value: number }>({
				name: 'store2',
				uniqueKeys: ['_id'],
			});
			await db1.open();
			await store1.insert({_id: '1', name: 'From Store1'});
			await store2.insert({_id: '2', value: 42});
			db1.close();

			// Session 2: Only register store1 (don't register store2)
			const db2 = new IDB_Database('test-upgrade-remove');
			const store1Again = db2.createStore<{ _id: string; name: string }>({
				name: 'store1',
				uniqueKeys: ['_id'],
			});
			await db2.open();

			// Store1 works fine
			const fromStore1 = await store1Again.get({_id: '1'});

			// Store2 is NOT accessible via getStore (not registered)
			const store2ViaGetStore = db2.getStore('store2');

			// Store2 still EXISTS in IDB (not deleted)
			const store2StillInIDB = await db2.storeExists('store2');

			// Registry should only contain store1
			const registry = JSON.parse(localStorage.getItem('idb-stores--test-upgrade-remove') || '{}');

			await db2.deleteDatabase();

			return {
				fromStore1,
				store2ViaGetStore: store2ViaGetStore === undefined,
				store2StillInIDB,
				registryStores: registry.stores,
			};
		});

		expect(result.fromStore1).toEqual({_id: '1', name: 'From Store1'});
		expect(result.store2ViaGetStore).toBe(true); // undefined because not registered
		expect(result.store2StillInIDB).toBe(true); // Still exists in actual IDB
		expect(result.registryStores).toEqual(['store1']); // Only registered store
	});

	test('re-add previously removed store - data still exists in IDB', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			// Session 1: Create with both stores
			const db1 = new IDB_Database('test-upgrade-readd');
			const store1 = db1.createStore<{ _id: string }>({name: 'store1', uniqueKeys: ['_id']});
			const store2 = db1.createStore<{ _id: string; data: string }>({name: 'store2', uniqueKeys: ['_id']});
			await db1.open();
			await store1.insert({_id: '1'});
			await store2.insert({_id: '2', data: 'important-data'});
			db1.close();

			// Session 2: Only register store1 (forget store2)
			const db2 = new IDB_Database('test-upgrade-readd');
			db2.createStore<{ _id: string }>({name: 'store1', uniqueKeys: ['_id']});
			await db2.open();
			db2.close();

			// Session 3: Register both stores again
			const db3 = new IDB_Database('test-upgrade-readd');
			db3.createStore<{ _id: string }>({name: 'store1', uniqueKeys: ['_id']});
			const store2Again = db3.createStore<{ _id: string; data: string }>({name: 'store2', uniqueKeys: ['_id']});
			await db3.open();

			// Store2 data should still be there!
			const dataFromStore2 = await store2Again.get({_id: '2'});
			const store2Count = await store2Again.count();

			await db3.deleteDatabase();

			return {dataFromStore2, store2Count};
		});

		expect(result.dataFromStore2).toEqual({_id: '2', data: 'important-data'});
		expect(result.store2Count).toBe(1);
	});

	test('registry reflects only currently registered stores', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;
			const registries: string[][] = [];

			// Session 1: All stores
			const db1 = new IDB_Database('test-upgrade-registry-track');
			db1.createStore<{ _id: string }>({name: 'users', uniqueKeys: ['_id']});
			db1.createStore<{ _id: string }>({name: 'orders', uniqueKeys: ['_id']});
			db1.createStore<{ _id: string }>({name: 'products', uniqueKeys: ['_id']});
			await db1.open();
			registries.push(JSON.parse(localStorage.getItem('idb-stores--test-upgrade-registry-track') || '{}').stores);
			db1.close();

			// Session 2: Remove orders
			const db2 = new IDB_Database('test-upgrade-registry-track');
			db2.createStore<{ _id: string }>({name: 'users', uniqueKeys: ['_id']});
			db2.createStore<{ _id: string }>({name: 'products', uniqueKeys: ['_id']});
			await db2.open();
			registries.push(JSON.parse(localStorage.getItem('idb-stores--test-upgrade-registry-track') || '{}').stores);
			db2.close();

			// Session 3: Remove products, add back orders
			const db3 = new IDB_Database('test-upgrade-registry-track');
			db3.createStore<{ _id: string }>({name: 'users', uniqueKeys: ['_id']});
			db3.createStore<{ _id: string }>({name: 'orders', uniqueKeys: ['_id']});
			await db3.open();
			registries.push(JSON.parse(localStorage.getItem('idb-stores--test-upgrade-registry-track') || '{}').stores);

			await db3.deleteDatabase();

			return registries;
		});

		expect(result[0].sort()).toEqual(['orders', 'products', 'users']);
		expect(result[1].sort()).toEqual(['products', 'users']);
		expect(result[2].sort()).toEqual(['orders', 'users']);
	});
});
