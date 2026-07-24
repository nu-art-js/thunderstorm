/*
 * @nu-art/idb-frontend - IndexedDB infrastructure for frontend applications
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 *
 * Bug: open() derives version only from localStorage registry. When the registry
 * key is cleared (or never written) but the physical IDB already exists at a
 * higher version, open(name, 1) throws VersionError and sync fails.
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';
const dbName = 'test-registry-cleared-existing-idb';
const registryKey = `idb-stores--${dbName}`;

test.describe('IDB_Database - registry cleared while physical IDB remains', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => window.IDBFrontend !== undefined);
		await page.evaluate(() => window.IDBFrontend.cleanupAllIDB());
	});

	test('open succeeds after localStorage registry cleared (IDB still at v3)', async ({page}) => {
		const result = await page.evaluate(async ({name, key}) => {
			const {IDB_Database} = window.IDBFrontend;

			// Session 1: bump physical IDB to version 3 via successive store additions
			const db1 = new IDB_Database(name);
			db1.createStore<{ _id: string }>({name: 'nodes', uniqueKeys: ['_id']});
			await db1.open();
			db1.close();

			const db2 = new IDB_Database(name);
			db2.createStore<{ _id: string }>({name: 'nodes', uniqueKeys: ['_id']});
			db2.createStore<{ _id: string }>({name: 'node-assignments', uniqueKeys: ['_id']});
			await db2.open();
			db2.close();

			const db3 = new IDB_Database(name);
			const store3 = db3.createStore<{ _id: string; label: string }>({
				name: 'nodes',
				uniqueKeys: ['_id'],
			});
			db3.createStore<{ _id: string }>({name: 'node-assignments', uniqueKeys: ['_id']});
			db3.createStore<{ _id: string }>({name: 'docs', uniqueKeys: ['_id']});
			await db3.open();
			await store3.insert({_id: 'n1', label: 'kept'});
			db3.close();

			const registryBefore = JSON.parse(localStorage.getItem(key) || '{}');
			const inspectBefore = await new Promise<{ version: number }>((resolve, reject) => {
				const req = indexedDB.open(name);
				req.onsuccess = () => {
					const version = req.result.version;
					req.result.close();
					resolve({version});
				};
				req.onerror = () => reject(req.error);
			});

			// Simulate clear_local_storage / lost registry while IDB remains
			localStorage.removeItem(key);

			// Session 2: same stores as last open — must not request version < physical
			const dbReopen = new IDB_Database(name);
			const nodes = dbReopen.createStore<{ _id: string; label: string }>({
				name: 'nodes',
				uniqueKeys: ['_id'],
			});
			dbReopen.createStore<{ _id: string }>({name: 'node-assignments', uniqueKeys: ['_id']});
			dbReopen.createStore<{ _id: string }>({name: 'docs', uniqueKeys: ['_id']});

			let openError: string | undefined;
			try {
				await dbReopen.open();
			} catch (e) {
				openError = `${(e as DOMException)?.name ?? 'Error'}: ${(e as Error)?.message ?? String(e)}`;
			}

			let persisted: { _id: string; label: string } | undefined;
			let openedVersion: number | undefined;
			if (!openError) {
				persisted = await nodes.get({_id: 'n1'});
				openedVersion = await new Promise<number>((resolve, reject) => {
					const req = indexedDB.open(name);
					req.onsuccess = () => {
						const version = req.result.version;
						req.result.close();
						resolve(version);
					};
					req.onerror = () => reject(req.error);
				});
				await dbReopen.deleteDatabase();
			}

			return {
				registryVersionBefore: registryBefore.version as number | undefined,
				physicalVersionBefore: inspectBefore.version,
				openError,
				persisted,
				openedVersion,
				registryAfter: localStorage.getItem(key),
			};
		}, {name: dbName, key: registryKey});

		expect(result.physicalVersionBefore).toBeGreaterThanOrEqual(3);
		expect(result.registryVersionBefore).toBe(result.physicalVersionBefore);
		expect(result.openError).toBeUndefined();
		expect(result.persisted).toEqual({_id: 'n1', label: 'kept'});
		expect(result.openedVersion).toBeGreaterThanOrEqual(result.physicalVersionBefore!);
	});

	test('open succeeds when registry version is stale below physical IDB version', async ({page}) => {
		const result = await page.evaluate(async ({name, key}) => {
			const {IDB_Database} = window.IDBFrontend;

			const db1 = new IDB_Database(name);
			db1.createStore<{ _id: string }>({name: 'nodes', uniqueKeys: ['_id']});
			await db1.open();
			db1.close();

			const db2 = new IDB_Database(name);
			db2.createStore<{ _id: string }>({name: 'nodes', uniqueKeys: ['_id']});
			db2.createStore<{ _id: string }>({name: 'node-assignments', uniqueKeys: ['_id']});
			await db2.open();
			db2.close();

			const physical = await new Promise<number>((resolve, reject) => {
				const req = indexedDB.open(name);
				req.onsuccess = () => {
					const version = req.result.version;
					req.result.close();
					resolve(version);
				};
				req.onerror = () => reject(req.error);
			});

			const registry = JSON.parse(localStorage.getItem(key)!);
			localStorage.setItem(key, JSON.stringify({...registry, version: 1}));

			const dbReopen = new IDB_Database(name);
			dbReopen.createStore<{ _id: string }>({name: 'nodes', uniqueKeys: ['_id']});
			dbReopen.createStore<{ _id: string }>({name: 'node-assignments', uniqueKeys: ['_id']});

			let openError: string | undefined;
			try {
				await dbReopen.open();
			} catch (e) {
				openError = `${(e as DOMException)?.name ?? 'Error'}: ${(e as Error)?.message ?? String(e)}`;
			}

			if (!openError)
				await dbReopen.deleteDatabase();

			return {physical, openError};
		}, {name: `${dbName}-stale-registry`, key: `idb-stores--${dbName}-stale-registry`});

		expect(result.physical).toBeGreaterThanOrEqual(2);
		expect(result.openError).toBeUndefined();
	});
});
