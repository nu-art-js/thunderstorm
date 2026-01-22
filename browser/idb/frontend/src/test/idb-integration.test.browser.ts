/*
 * @nu-art/idb-frontend - IndexedDB infrastructure for frontend applications
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 *
 * This test file demonstrates Option B: Using mocha with Playwright library
 * Compare with idb-integration-playwright.test.browser.ts which uses Option A: Playwright's test runner
 *
 * Key differences:
 * - Uses mocha's describe/it syntax (familiar to existing test patterns)
 * - Manual browser/page lifecycle management (before/after hooks)
 * - Uses chai for assertions (to.deep.equal, to.be.an, etc.)
 * - More verbose setup but consistent with other test types in BAI
 */

import {chromium, Browser, Page} from 'playwright';
import {expect} from 'chai';
import {DBConfig} from '@nu-art/idb-shared';
import {DBProto} from '@nu-art/ts-common';

type TestItem = {
	_id: string;
	name: string;
	value: number;
};

type TestProto = DBProto<{
	type: TestItem;
	dbKey: 'test-db';
	generatedKeys: '_id';
	versions: { current: '1.0.0' };
	uniqueKeys: '_id';
}>;

describe('IDBManager - Browser Integration', () => {
	let browser: Browser;
	let page: Page;

	const dbConfig: DBConfig<TestProto> = {
		name: 'test-store',
		group: 'test-database',
		version: '1.0.0',
		autoIncrement: false,
		uniqueKeys: ['_id'],
		indices: []
	};

	before(async function() {
		this.timeout(30000);
		browser = await chromium.launch({headless: true});
	});

	after(async () => {
		await browser.close();
	});

	beforeEach(async () => {
		page = await browser.newPage();
		// Load bundled code or use page.addScriptTag to load modules
		// For now, code will be bundled and loaded
	});

	afterEach(async () => {
		await page.close();
	});

	it('should register store and insert data', async function() {
		this.timeout(30000);

		// Load the bundled IDB code into browser context
		// Note: This requires the code to be built first (dist/index.js)
		// In a real scenario, you would bundle the code for browser execution
		await page.addScriptTag({path: './dist/index.js'});

		const result = await page.evaluate(async (config) => {
			// @ts-ignore - IDBManager is now available in browser context
			const store = IDBManager.register(config, async () => {
				console.log('Database opened');
			});

			const testItem = {_id: '1', name: 'Test Item', value: 100};
			await store.insert(testItem);

			const retrieved = await store.get({_id: '1'});
			return retrieved;
		}, dbConfig);

		expect(result).to.deep.equal({_id: '1', name: 'Test Item', value: 100});
	});

	it('should query data with filters', async function() {
		this.timeout(30000);

		await page.addScriptTag({path: './dist/index.js'});

		const result = await page.evaluate(async (config) => {
			// @ts-ignore
			const store = IDBManager.register(config, async () => {
				console.log('Database opened');
			});

			// Insert multiple items
			await store.insert({_id: '1', name: 'Item 1', value: 100});
			await store.insert({_id: '2', name: 'Item 2', value: 200});
			await store.insert({_id: '3', name: 'Item 3', value: 300});

			// Query all items
			const allItems = await store.query({});
			return allItems;
		}, dbConfig);

		expect(result).to.be.an('array');
		expect(result).to.have.length(3);
	});

	it('should delete data', async function() {
		this.timeout(30000);

		await page.addScriptTag({path: './dist/index.js'});

		const result = await page.evaluate(async (config) => {
			// @ts-ignore
			const store = IDBManager.register(config, async () => {
				console.log('Database opened');
			});

			// Insert item
			await store.insert({_id: '1', name: 'Item 1', value: 100});

			// Delete item
			const deleted = await store.delete({_id: '1'});

			// Try to get deleted item
			const retrieved = await store.get({_id: '1'});

			return {deleted, retrieved};
		}, dbConfig);

		expect(result.deleted).to.deep.equal({_id: '1', name: 'Item 1', value: 100});
		expect(result.retrieved).to.be.undefined;
	});
});
