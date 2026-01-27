/*
 * @nu-art/idb-frontend - IndexedDB infrastructure for frontend applications
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';

test.describe('IDB_Store - Upgrade Processor (Lazy Migration)', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => window.IDBFrontend !== undefined);
		await page.evaluate(() => window.IDBFrontend.cleanupAllIDB());
	});

	test('upgradeProcessor transforms item on get()', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			// Session 1: Insert old-schema data (no processor)
			const db1 = new IDB_Database('test-migration-get');
			const storeOld = db1.createStore<{ _id: string; name: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db1.open();
			await storeOld.insert({_id: '1', name: 'Test'});
			db1.close();

			// Session 2: Read with upgrade processor
			const db2 = new IDB_Database('test-migration-get');
			const storeNew = db2.createStore<{ _id: string; name: string; version: number }>({
				name: 'items',
				uniqueKeys: ['_id'],
				upgradeProcessor: (item: any) => ({
					...item,
					version: item.version ?? 2,
				}),
			});
			await db2.open();

			const upgraded = await storeNew.get({_id: '1'});
			await db2.deleteDatabase();

			return upgraded;
		});

		expect(result).toEqual({_id: '1', name: 'Test', version: 2});
	});

	test('upgradeProcessor transforms all items on getAll()', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			// Session 1: Insert old-schema data
			const db1 = new IDB_Database('test-migration-getall');
			const storeOld = db1.createStore<{ _id: string; value: number }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db1.open();
			await storeOld.insertAll([
				{_id: '1', value: 10},
				{_id: '2', value: 20},
				{_id: '3', value: 30},
			]);
			db1.close();

			// Session 2: Read with upgrade processor that doubles values
			const db2 = new IDB_Database('test-migration-getall');
			const storeNew = db2.createStore<{ _id: string; value: number; processed: boolean }>({
				name: 'items',
				uniqueKeys: ['_id'],
				upgradeProcessor: (item: any) => ({
					...item,
					value: item.value * 2,
					processed: true,
				}),
			});
			await db2.open();

			const all = await storeNew.getAll();
			await db2.deleteDatabase();

			return all;
		});

		expect(result).toHaveLength(3);
		expect(result).toContainEqual({_id: '1', value: 20, processed: true});
		expect(result).toContainEqual({_id: '2', value: 40, processed: true});
		expect(result).toContainEqual({_id: '3', value: 60, processed: true});
	});

	test('upgradeProcessor transforms items on getAll() then filter', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			// Session 1: Insert old-schema data
			const db1 = new IDB_Database('test-migration-queryfilter');
			const storeOld = db1.createStore<{ _id: string; score: number }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db1.open();
			await storeOld.insertAll([
				{_id: '1', score: 50},
				{_id: '2', score: 80},
				{_id: '3', score: 30},
			]);
			db1.close();

			// Session 2: Read with processor that adds grade
			const db2 = new IDB_Database('test-migration-queryfilter');
			const storeNew = db2.createStore<{ _id: string; score: number; grade: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
				upgradeProcessor: (item: any) => ({
					...item,
					grade: item.score >= 60 ? 'PASS' : 'FAIL',
				}),
			});
			await db2.open();

			const all = await storeNew.getAll();
			const passing = all.filter(item => item.grade === 'PASS');
			await db2.deleteDatabase();

			return passing;
		});

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({_id: '2', score: 80, grade: 'PASS'});
	});

	test('upgradeProcessor transforms items on getAll() then find', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			// Session 1: Insert old-schema data
			const db1 = new IDB_Database('test-migration-queryfind');
			const storeOld = db1.createStore<{ _id: string; active: boolean }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db1.open();
			await storeOld.insertAll([
				{_id: '1', active: false},
				{_id: '2', active: true},
			]);
			db1.close();

			// Session 2: Read with processor that adds status
			const db2 = new IDB_Database('test-migration-queryfind');
			const storeNew = db2.createStore<{ _id: string; active: boolean; status: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
				upgradeProcessor: (item: any) => ({
					...item,
					status: item.active ? 'ONLINE' : 'OFFLINE',
				}),
			});
			await db2.open();

			const all = await storeNew.getAll();
			const online = all.find(item => item.status === 'ONLINE');
			await db2.deleteDatabase();

			return online;
		});

		expect(result).toEqual({_id: '2', active: true, status: 'ONLINE'});
	});

	test('upgradeProcessor transforms items on getAll() then map', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			// Session 1: Insert old-schema data
			const db1 = new IDB_Database('test-migration-querymap');
			const storeOld = db1.createStore<{ _id: string; firstName: string; lastName: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db1.open();
			await storeOld.insertAll([
				{_id: '1', firstName: 'John', lastName: 'Doe'},
				{_id: '2', firstName: 'Jane', lastName: 'Smith'},
			]);
			db1.close();

			// Session 2: Read with processor that adds fullName
			const db2 = new IDB_Database('test-migration-querymap');
			const storeNew = db2.createStore<{ _id: string; firstName: string; lastName: string; fullName: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
				upgradeProcessor: (item: any) => ({
					...item,
					fullName: `${item.firstName} ${item.lastName}`,
				}),
			});
			await db2.open();

			const all = await storeNew.getAll();
			const fullNames = all.map(item => item.fullName);
			await db2.deleteDatabase();

			return fullNames.sort();
		});

		expect(result).toEqual(['Jane Smith', 'John Doe']);
	});

	test('upgradeProcessor transforms deleted item return value', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			// Session 1: Insert old-schema data
			const db1 = new IDB_Database('test-migration-delete');
			const storeOld = db1.createStore<{ _id: string; value: number }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db1.open();
			await storeOld.insert({_id: '1', value: 100});
			db1.close();

			// Session 2: Delete with processor
			const db2 = new IDB_Database('test-migration-delete');
			const storeNew = db2.createStore<{ _id: string; value: number; doubled: number }>({
				name: 'items',
				uniqueKeys: ['_id'],
				upgradeProcessor: (item: any) => ({
					...item,
					doubled: item.value * 2,
				}),
			});
			await db2.open();

			// Delete returns the upgraded item
			const deleted = await storeNew.delete({_id: '1'});
			await db2.deleteDatabase();

			return deleted;
		});

		expect(result).toEqual({_id: '1', value: 100, doubled: 200});
	});

	test('no processor = items pass through unchanged', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-migration-noprocessor');
			const store = db.createStore<{ _id: string; name: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
				// No upgradeProcessor
			});
			await db.open();

			await store.insert({_id: '1', name: 'Original'});
			const item = await store.get({_id: '1'});

			await db.deleteDatabase();

			return item;
		});

		expect(result).toEqual({_id: '1', name: 'Original'});
	});

	test('processor can add missing fields', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			// Session 1: Old schema without new fields
			const db1 = new IDB_Database('test-migration-add-fields');
			const storeOld = db1.createStore<{ _id: string; name: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db1.open();
			await storeOld.insert({_id: '1', name: 'Item'});
			db1.close();

			// Session 2: New schema with required fields
			const db2 = new IDB_Database('test-migration-add-fields');
			const storeNew = db2.createStore<{ _id: string; name: string; createdAt: number; active: boolean }>({
				name: 'items',
				uniqueKeys: ['_id'],
				upgradeProcessor: (item: any) => ({
					_id: item._id,
					name: item.name,
					createdAt: item.createdAt ?? Date.now(),
					active: item.active ?? true,
				}),
			});
			await db2.open();

			const item = await storeNew.get({_id: '1'});
			await db2.deleteDatabase();

			return {
				hasCreatedAt: typeof item!.createdAt === 'number',
				active: item!.active,
				name: item!.name,
			};
		});

		expect(result.hasCreatedAt).toBe(true);
		expect(result.active).toBe(true);
		expect(result.name).toBe('Item');
	});

	test('processor can rename fields', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			// Session 1: Old schema with old field name
			const db1 = new IDB_Database('test-migration-rename');
			const storeOld = db1.createStore<{ _id: string; userName: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db1.open();
			await storeOld.insert({_id: '1', userName: 'john_doe'});
			db1.close();

			// Session 2: New schema with renamed field
			const db2 = new IDB_Database('test-migration-rename');
			const storeNew = db2.createStore<{ _id: string; username: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
				upgradeProcessor: (item: any) => ({
					_id: item._id,
					username: item.username ?? item.userName, // Support both old and new
				}),
			});
			await db2.open();

			const item = await storeNew.get({_id: '1'});
			await db2.deleteDatabase();

			return item;
		});

		expect(result).toEqual({_id: '1', username: 'john_doe'});
	});

	test('processor can transform field values', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			// Session 1: Old schema with string status
			const db1 = new IDB_Database('test-migration-transform');
			const storeOld = db1.createStore<{ _id: string; status: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db1.open();
			await storeOld.insertAll([
				{_id: '1', status: 'active'},
				{_id: '2', status: 'inactive'},
				{_id: '3', status: 'pending'},
			]);
			db1.close();

			// Session 2: New schema converts string to enum code
			const statusMap: Record<string, number> = {
				'active': 1,
				'inactive': 0,
				'pending': 2,
			};

			const db2 = new IDB_Database('test-migration-transform');
			const storeNew = db2.createStore<{ _id: string; status: number }>({
				name: 'items',
				uniqueKeys: ['_id'],
				upgradeProcessor: (item: any) => ({
					_id: item._id,
					status: typeof item.status === 'string' ? (statusMap[item.status] ?? -1) : item.status,
				}),
			});
			await db2.open();

			const all = await storeNew.getAll();
			await db2.deleteDatabase();

			return all;
		});

		expect(result).toContainEqual({_id: '1', status: 1});
		expect(result).toContainEqual({_id: '2', status: 0});
		expect(result).toContainEqual({_id: '3', status: 2});
	});
});
