/*
 * @nu-art/idb-frontend - IndexedDB infrastructure for frontend applications
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';

test.describe('IDB_Store - Insert Operations', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => window.IDBFrontend !== undefined);
		await page.evaluate(() => window.IDBFrontend.cleanupAllIDB());
	});

	test('insert() returns inserted item', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-insert-return');
			const store = db.createStore<{ _id: string; name: string; value: number }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			const inserted = await store.insert({_id: '1', name: 'Test', value: 42});
			await db.deleteDatabase();

			return inserted;
		});

		expect(result).toEqual({_id: '1', name: 'Test', value: 42});
	});

	test('insertAll() inserts multiple items', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-insertall');
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

			const all = await store.getAll();
			const count = await store.count();
			await db.deleteDatabase();

			return {all, count};
		});

		expect(result.count).toBe(3);
		expect(result.all).toContainEqual({_id: '1', name: 'One'});
		expect(result.all).toContainEqual({_id: '2', name: 'Two'});
		expect(result.all).toContainEqual({_id: '3', name: 'Three'});
	});

	test('insert() duplicate key throws error', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-insert-duplicate');
			const store = db.createStore<{ _id: string; name: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			await store.insert({_id: '1', name: 'First'});

			let errorThrown = false;
			try {
				await store.insert({_id: '1', name: 'Duplicate'});
			} catch (e) {
				errorThrown = true;
			}

			// Original item should remain
			const item = await store.get({_id: '1'});
			await db.deleteDatabase();

			return {errorThrown, item};
		});

		expect(result.errorThrown).toBe(true);
		expect(result.item).toEqual({_id: '1', name: 'First'});
	});

	test('upsert() updates existing item', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-upsert-update');
			const store = db.createStore<{ _id: string; name: string; value: number }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			await store.insert({_id: '1', name: 'Original', value: 10});
			const before = await store.get({_id: '1'});

			await store.upsert({_id: '1', name: 'Updated', value: 20});
			const after = await store.get({_id: '1'});

			await db.deleteDatabase();

			return {before, after};
		});

		expect(result.before).toEqual({_id: '1', name: 'Original', value: 10});
		expect(result.after).toEqual({_id: '1', name: 'Updated', value: 20});
	});

	test('upsert() creates new if not exists', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-upsert-create');
			const store = db.createStore<{ _id: string; name: string }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			const beforeCount = await store.count();

			const upserted = await store.upsert({_id: '1', name: 'New Item'});
			const afterCount = await store.count();
			const retrieved = await store.get({_id: '1'});

			await db.deleteDatabase();

			return {beforeCount, afterCount, upserted, retrieved};
		});

		expect(result.beforeCount).toBe(0);
		expect(result.afterCount).toBe(1);
		expect(result.upserted).toEqual({_id: '1', name: 'New Item'});
		expect(result.retrieved).toEqual({_id: '1', name: 'New Item'});
	});

	test('upsertAll() batch upsert', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {IDB_Database} = window.IDBFrontend;

			const db = new IDB_Database('test-upsertall');
			const store = db.createStore<{ _id: string; name: string; value: number }>({
				name: 'items',
				uniqueKeys: ['_id'],
			});
			await db.open();

			// Insert some initial items
			await store.insertAll([
				{_id: '1', name: 'One', value: 1},
				{_id: '2', name: 'Two', value: 2},
			]);

			// Upsert: update existing + add new
			await store.upsertAll([
				{_id: '1', name: 'One Updated', value: 10},
				{_id: '3', name: 'Three', value: 3},
			]);

			const all = await store.getAll();
			await db.deleteDatabase();

			return all;
		});

		expect(result).toHaveLength(3);
		expect(result).toContainEqual({_id: '1', name: 'One Updated', value: 10});
		expect(result).toContainEqual({_id: '2', name: 'Two', value: 2});
		expect(result).toContainEqual({_id: '3', name: 'Three', value: 3});
	});
});
