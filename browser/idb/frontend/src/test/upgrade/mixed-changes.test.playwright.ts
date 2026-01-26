/*
 * @nu-art/idb-frontend - IndexedDB infrastructure for frontend applications
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';

test.describe('IDB_Database - Mixed Changes Upgrade', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => window.IDBFrontend !== undefined);
		await page.evaluate(() => window.IDBFrontend.cleanupAllIDB());
	});

	test('add one store while not registering another', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			// Session 1: stores A and B
			const db1 = new IDB_Database('test-upgrade-mixed');
			const storeA = db1.createStore<{ _id: string; data: string }>({name: 'storeA', uniqueKeys: ['_id']});
			const storeB = db1.createStore<{ _id: string; data: string }>({name: 'storeB', uniqueKeys: ['_id']});
			await db1.open();
			await storeA.insert({_id: 'a1', data: 'DataA'});
			await storeB.insert({_id: 'b1', data: 'DataB'});
			db1.close();

			// Session 2: keep A, drop B, add C
			const db2 = new IDB_Database('test-upgrade-mixed');
			const storeAAgain = db2.createStore<{ _id: string; data: string }>({name: 'storeA', uniqueKeys: ['_id']});
			const storeC = db2.createStore<{ _id: string; data: string }>({name: 'storeC', uniqueKeys: ['_id']});
			await db2.open();

			// Verify A data persists
			const fromA = await storeAAgain.get({_id: 'a1'});

			// Verify C works
			await storeC.insert({_id: 'c1', data: 'DataC'});
			const fromC = await storeC.get({_id: 'c1'});

			// B is not accessible but still in IDB
			const bExists = await db2.storeExists('storeB');
			const bViaAPI = db2.getStore('storeB');

			const registry = JSON.parse(localStorage.getItem('idb-stores--test-upgrade-mixed') || '{}');

			await db2.deleteDatabase();

			return {
				fromA,
				fromC,
				bExists,
				bViaAPI: bViaAPI === undefined,
				registryStores: registry.stores.sort(),
			};
		});

		expect(result.fromA).toEqual({_id: 'a1', data: 'DataA'});
		expect(result.fromC).toEqual({_id: 'c1', data: 'DataC'});
		expect(result.bExists).toBe(true);
		expect(result.bViaAPI).toBe(true);
		expect(result.registryStores).toEqual(['storeA', 'storeC']);
	});

	test('change store config (add index) triggers upgrade', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			// Session 1: Store without index
			const db1 = new IDB_Database('test-upgrade-config-change');
			const store = db1.createStore<{ _id: string; category: string; name: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db1.open();
			await store.insert({_id: '1', category: 'A', name: 'Item1'});
			await store.insert({_id: '2', category: 'B', name: 'Item2'});
			await store.insert({_id: '3', category: 'A', name: 'Item3'});

			const registryBefore = JSON.parse(localStorage.getItem('idb-stores--test-upgrade-config-change') || '{}');
			db1.close();

			// Session 2: Same store with index added
			// Note: Adding index to existing store requires re-creation in IDB
			// The current implementation only creates new stores, not modifies existing ones
			// This test verifies that the hash changes when config changes
			const db2 = new IDB_Database('test-upgrade-config-change');
			const storeWithIndex = db2.createStore<{ _id: string; category: string; name: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			storeWithIndex.createIndex('by-category', 'category');
			await db2.open();

			const registryAfter = JSON.parse(localStorage.getItem('idb-stores--test-upgrade-config-change') || '{}');

			// Data should persist
			const all = await storeWithIndex.getAll();

			await db2.deleteDatabase();

			return {
				hashBefore: registryBefore.hash,
				hashAfter: registryAfter.hash,
				versionBefore: registryBefore.version,
				versionAfter: registryAfter.version,
				dataCount: all.length,
			};
		});

		// Hash should change when index is added
		expect(result.hashBefore).not.toBe(result.hashAfter);
		// Version should increment
		expect(result.versionAfter).toBeGreaterThan(result.versionBefore);
		// Data persists
		expect(result.dataCount).toBe(3);
	});

	test('version increments correctly across multiple upgrades', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;
			const versions: number[] = [];

			// Session 1: Initial with A
			const db1 = new IDB_Database('test-upgrade-version-multi');
			const a1 = db1.createStore<{ _id: string }>({name: 'storeA', uniqueKeys: ['_id']});
			await db1.open();
			await a1.insert({_id: '1'});
			versions.push(JSON.parse(localStorage.getItem('idb-stores--test-upgrade-version-multi') || '{}').version);
			db1.close();

			// Session 2: Add B
			const db2 = new IDB_Database('test-upgrade-version-multi');
			db2.createStore<{ _id: string }>({name: 'storeA', uniqueKeys: ['_id']});
			db2.createStore<{ _id: string }>({name: 'storeB', uniqueKeys: ['_id']});
			await db2.open();
			versions.push(JSON.parse(localStorage.getItem('idb-stores--test-upgrade-version-multi') || '{}').version);
			db2.close();

			// Session 3: Drop B, add C and D
			const db3 = new IDB_Database('test-upgrade-version-multi');
			db3.createStore<{ _id: string }>({name: 'storeA', uniqueKeys: ['_id']});
			db3.createStore<{ _id: string }>({name: 'storeC', uniqueKeys: ['_id']});
			db3.createStore<{ _id: string }>({name: 'storeD', uniqueKeys: ['_id']});
			await db3.open();
			versions.push(JSON.parse(localStorage.getItem('idb-stores--test-upgrade-version-multi') || '{}').version);
			db3.close();

			// Session 4: No changes (same stores)
			const db4 = new IDB_Database('test-upgrade-version-multi');
			db4.createStore<{ _id: string }>({name: 'storeA', uniqueKeys: ['_id']});
			db4.createStore<{ _id: string }>({name: 'storeC', uniqueKeys: ['_id']});
			db4.createStore<{ _id: string }>({name: 'storeD', uniqueKeys: ['_id']});
			await db4.open();
			versions.push(JSON.parse(localStorage.getItem('idb-stores--test-upgrade-version-multi') || '{}').version);

			await db4.deleteDatabase();

			return versions;
		});

		expect(result[0]).toBe(1); // Initial
		expect(result[1]).toBe(2); // Added B
		expect(result[2]).toBe(3); // Dropped B, added C and D
		expect(result[3]).toBe(3); // No change, same version
	});

	test('hash in localStorage matches current config', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			// Create two databases with different configs
			const db1 = new IDB_Database('test-upgrade-hash-match');
			db1.createStore<{ _id: string }>({name: 'users', uniqueKeys: ['_id']});
			db1.createStore<{ _id: string }>({name: 'orders', uniqueKeys: ['_id']});
			await db1.open();
			const hash1 = JSON.parse(localStorage.getItem('idb-stores--test-upgrade-hash-match') || '{}').hash;
			db1.close();

			// Reopen with same config - hash should be same
			const db2 = new IDB_Database('test-upgrade-hash-match');
			db2.createStore<{ _id: string }>({name: 'users', uniqueKeys: ['_id']});
			db2.createStore<{ _id: string }>({name: 'orders', uniqueKeys: ['_id']});
			await db2.open();
			const hash2 = JSON.parse(localStorage.getItem('idb-stores--test-upgrade-hash-match') || '{}').hash;
			db2.close();

			// Reopen with different config - hash should change
			const db3 = new IDB_Database('test-upgrade-hash-match');
			db3.createStore<{ _id: string }>({name: 'users', uniqueKeys: ['_id']});
			db3.createStore<{ _id: string }>({name: 'orders', uniqueKeys: ['_id']});
			db3.createStore<{ _id: string }>({name: 'products', uniqueKeys: ['_id']});
			await db3.open();
			const hash3 = JSON.parse(localStorage.getItem('idb-stores--test-upgrade-hash-match') || '{}').hash;

			await db3.deleteDatabase();

			return {hash1, hash2, hash3};
		});

		expect(result.hash1).toBe(result.hash2); // Same config = same hash
		expect(result.hash1).not.toBe(result.hash3); // Different config = different hash
	});
});
