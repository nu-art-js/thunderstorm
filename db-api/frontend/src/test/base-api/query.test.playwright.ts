/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';
import {AxiosResponse as Axios_Response} from 'axios';

const testPagePath = '/src/test/index.html';

test.describe('BaseApi - query', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => (window as _Window).DbApiFrontend !== undefined);
		await page.evaluate(() => (window as _Window).DbApiFrontend.cleanupDbApiIDB());
	});

	test('query(body) triggers request and handleQueryComplete updates cache/IDB', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi, HttpClient} = (window as _Window).DbApiFrontend;
			const response = [{_id: '1', name: 'a', __created: 1, __updated: 1, _v: 'v1'}];
			const client = new HttpClient();
			client.setConfig({origin: 'http://127.0.0.1'});
			(client as any).sendRequest = async () => ({data: response, status: 200, statusText: 'OK', headers: {}, config: {}} as Axios_Response);

			const api = new TestBaseApi(client);
			await api.init();
			await api.query({});
			const all = api.cache.all();
			return {length: all.length, first: all[0]};
		});
		console.log('query items:', JSON.stringify(result.all ?? result.items ?? result));
		expect(result.length).toBe(1);
		expect(result.first?.name).toBe('a');
	});
});
