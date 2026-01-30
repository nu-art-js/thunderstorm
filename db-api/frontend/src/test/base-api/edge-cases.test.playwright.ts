/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';

test.describe('BaseApi - edge cases', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => (window as _Window).DbApiFrontend !== undefined);
		await page.evaluate(() => (window as _Window).DbApiFrontend.cleanupDbApiIDB());
	});

	test('query with empty array response leaves cache empty', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi, HttpClient} = (window as _Window).DbApiFrontend;
			const client = new HttpClient();
			client.setConfig({origin: 'http://127.0.0.1'});
			(client as any).sendRequest = async () => ({data: [], status: 200, statusText: 'OK', headers: {}, config: {}});
			const api = new TestBaseApi(client);
			await api.init();
			await api.query({});
			const all = api.cache.all();
			return {length: all.length};
		});
		expect(result.length).toBe(0);
	});

	test('queryUnique with undefined response leaves cache unchanged', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi, HttpClient} = (window as _Window).DbApiFrontend;
			const client = new HttpClient();
			client.setConfig({origin: 'http://127.0.0.1'});
			(client as any).sendRequest = async () => ({data: undefined, status: 200, statusText: 'OK', headers: {}, config: {}});
			const api = new TestBaseApi(client);
			await api.init();
			let threw = false;
			try {
				await api.queryUnique({_id: 'nonexistent'});
			} catch (_e) {
				threw = true;
			}
			const cacheLength = api.cache.all().length;
			return {threw, cacheLength};
		});
		expect(result.cacheLength).toBe(0);
	});

	test('delete with no response body: cache not updated when response is falsy', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi, HttpClient} = (window as _Window).DbApiFrontend;
			const existing = {_id: '1', name: 'a', __created: 1, __updated: 1, _v: 'v1'};
			const client = new HttpClient();
			client.setConfig({origin: 'http://127.0.0.1'});
			(client as any).sendRequest = async () => ({data: null, status: 200, statusText: 'OK', headers: {}, config: {}});
			const api = new TestBaseApi(client);
			await api.init();
			await api.onEntriesUpdated([existing]);
			await api.loadCache();
			const beforeLength = api.cache.all().length;
			await api.delete({_id: '1'});
			const afterLength = api.cache.all().length;
			const stillHas = api.cache.all().some((x: any) => x._id === '1');
			return {beforeLength, afterLength, stillHas};
		});
		expect(result.beforeLength).toBe(1);
		expect(result.afterLength).toBe(1);
		expect(result.stillHas).toBe(true);
	});

	test('query before init: completion runs; cache ends in consistent state (empty)', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi, HttpClient} = (window as _Window).DbApiFrontend;
			const client = new HttpClient();
			client.setConfig({origin: 'http://127.0.0.1'});
			(client as any).sendRequest = async () => ({data: [], status: 200, statusText: 'OK', headers: {}, config: {}});
			const api = new TestBaseApi(client);
			let thrown = false;
			try {
				await api.query({});
			} catch (_e) {
				thrown = true;
			}
			const cacheLength = api.cache.all().length;
			return {thrown, cacheLength};
		});
		expect(result.cacheLength).toBe(0);
	});

	test('deleteQuery with no response body: no crash, cache unchanged', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi, HttpClient} = (window as _Window).DbApiFrontend;
			const existing = {_id: '1', name: 'a', __created: 1, __updated: 1, _v: 'v1'};
			const client = new HttpClient();
			client.setConfig({origin: 'http://127.0.0.1'});
			(client as any).sendRequest = async () => ({data: null, status: 200, statusText: 'OK', headers: {}, config: {}});
			const api = new TestBaseApi(client);
			await api.init();
			await api.onEntriesUpdated([existing]);
			await api.loadCache();
			let threw = false;
			try {
				await api.deleteQuery({});
			} catch (_e) {
				threw = true;
			}
			const all = api.cache.all();
			return {threw, length: all.length, stillHas: all.some((x: any) => x._id === '1')};
		});
		expect(result.threw).toBe(false);
		expect(result.length).toBe(1);
		expect(result.stillHas).toBe(true);
	});
});
