/*
 * @nu-art/idb-frontend - IndexedDB infrastructure for frontend applications
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';

test.describe('IDB_Store - Sync Metadata', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => window.IDBFrontend !== undefined);
		await page.evaluate(() => window.IDBFrontend.cleanupAllIDB());
	});

	test('setLastSync() / getLastSync() roundtrip', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-sync-lastsync');
			const store = db.createStore<{ _id: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			const timestamp = Date.now();
			store.setLastSync(timestamp);
			const retrieved = store.getLastSync();

			await db.deleteDatabase();

			return {timestamp, retrieved};
		});

		expect(result.retrieved).toBe(result.timestamp);
	});

	test('getLastSync() returns default value if not set', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-sync-lastsync-default');
			const store = db.createStore<{ _id: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			const defaultValue = store.getLastSync();
			const customDefault = store.getLastSync(999);

			await db.deleteDatabase();

			return {defaultValue, customDefault};
		});

		expect(result.defaultValue).toBe(0);
		expect(result.customDefault).toBe(999);
	});

	test('setLastVersion() / getLastVersion() roundtrip', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-sync-lastversion');
			const store = db.createStore<{ _id: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			const version = 'v2.5.1-beta';
			store.setLastVersion(version);
			const retrieved = store.getLastVersion();

			await db.deleteDatabase();

			return {version, retrieved};
		});

		expect(result.retrieved).toBe(result.version);
	});

	test('getLastVersion() returns null if not set', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-sync-lastversion-null');
			const store = db.createStore<{ _id: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			const version = store.getLastVersion();
			await db.deleteDatabase();

			return version;
		});

		expect(result).toBeNull();
	});

	test('clearSyncMetadata() removes both keys', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-sync-clear');
			const store = db.createStore<{ _id: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			// Set both metadata values
			store.setLastSync(12345);
			store.setLastVersion('v1.0');

			const beforeSync = store.getLastSync();
			const beforeVersion = store.getLastVersion();

			// Clear metadata
			store.clearSyncMetadata();

			const afterSync = store.getLastSync();
			const afterVersion = store.getLastVersion();

			await db.deleteDatabase();

			return {beforeSync, beforeVersion, afterSync, afterVersion};
		});

		expect(result.beforeSync).toBe(12345);
		expect(result.beforeVersion).toBe('v1.0');
		expect(result.afterSync).toBe(0); // Default when not set
		expect(result.afterVersion).toBeNull();
	});

	test('sync metadata persists across sessions', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			// Session 1: Set metadata
			const db1 = new IDB_Database('test-sync-persist');
			const store1 = db1.createStore<{ _id: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db1.open();

			store1.setLastSync(99999);
			store1.setLastVersion('v3.0');
			db1.close();

			// Session 2: Read metadata
			const db2 = new IDB_Database('test-sync-persist');
			const store2 = db2.createStore<{ _id: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db2.open();

			const sync = store2.getLastSync();
			const version = store2.getLastVersion();

			await db2.deleteDatabase();

			return {sync, version};
		});

		expect(result.sync).toBe(99999);
		expect(result.version).toBe('v3.0');
	});
});
