/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';

test.describe('Integration - full CRUD flow', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => (window as _Window).DbApiFrontend !== undefined);
		await page.evaluate(() => (window as _Window).DbApiFrontend.cleanupDbApiIDB());
	});

	test('query then upsert then patch then delete leaves cache in correct final state', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi, HttpClient} = (window as _Window).DbApiFrontend;
			let callCount = 0;
			const client = new HttpClient();
			client.setConfig({origin: 'http://127.0.0.1'});
			(client as any).sendRequest = async (req: any) => {
				callCount++;
				const path = req?.url ?? '';
				if (path.includes('query')) return {
					data: [{_id: '1', name: 'a', __created: 1, __updated: 1, _v: 'v1'}],
					status: 200,
					statusText: 'OK',
					headers: {},
					config: {}
				};
				if (path.includes('upsert')) return {
					data: {_id: '1', name: 'upserted', __created: 1, __updated: 2, _v: 'v1'},
					status: 200,
					statusText: 'OK',
					headers: {},
					config: {}
				};
				if (path.includes('patch')) return {
					data: {_id: '1', name: 'patched', __created: 1, __updated: 3, _v: 'v1'},
					status: 200,
					statusText: 'OK',
					headers: {},
					config: {}
				};
				if (path.includes('delete-unique')) return {
					data: {_id: '1', name: 'patched', __created: 1, __updated: 3, _v: 'v1'},
					status: 200,
					statusText: 'OK',
					headers: {},
					config: {}
				};
				return {data: null, status: 200, statusText: 'OK', headers: {}, config: {}};
			};
			const api = new TestBaseApi(client);
			await api.init();
			await api.query({});
			const afterQuery = api.cache.all().length;
			await api.upsert({_id: '1', name: 'upserted'});
			const afterUpsert = api.cache.all().find((x: any) => x._id === '1')?.name;
			await api.patch({_id: '1', name: 'patched'});
			const afterPatch = api.cache.all().find((x: any) => x._id === '1')?.name;
			await api.deleteUnique({_id: '1'});
			const afterDelete = api.cache.all().length;
			return {afterQuery, afterUpsert, afterPatch, afterDelete, callCount};
		});
		expect(result.afterQuery).toBe(1);
		expect(result.afterUpsert).toBe('upserted');
		expect(result.afterPatch).toBe('patched');
		expect(result.afterDelete).toBe(0);
	});

	test('IDB persistence: seed, loadCache, clear cache, loadCache again returns same data', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi, HttpClient} = (window as _Window).DbApiFrontend;
			const client = new HttpClient();
			client.setConfig({origin: 'http://127.0.0.1'});
			(client as any).sendRequest = async () => ({data: null, status: 200, statusText: 'OK', headers: {}, config: {}});
			const api = new TestBaseApi(client);
			await api.init();
			const seed = [
				{_id: '1', name: 'a', __created: 1, __updated: 1, _v: 'v1'},
				{_id: '2', name: 'b', __created: 2, __updated: 2, _v: 'v1'}
			];
			await api.onEntriesUpdated(seed);
			await api.loadCache();
			const afterFirst = api.cache.all().length;
			api.cache.clear();
			const afterClear = api.cache.all().length;
			await api.loadCache();
			const all = api.cache.all();
			return {afterFirst, afterClear, length: all.length, names: all.map((x: any) => x.name).sort()};
		});
		expect(result.afterFirst).toBe(2);
		expect(result.afterClear).toBe(0);
		expect(result.length).toBe(2);
		expect(result.names).toEqual(['a', 'b']);
	});
});
