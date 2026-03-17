/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';

test.describe('BaseDB - dispatcher', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => (window as any).DbApiFrontend !== undefined);
		await page.evaluate(() => (window as any).DbApiFrontend.cleanupDbApiIDB());
	});

	test('onEntriesUpdated dispatches to module and UI', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi, HttpClient} = (window as any).DbApiFrontend;
			const moduleEvents: { event: string; item: any }[] = [];
			const uiEvents: { event: string; item: any }[] = [];
			const spy = {
				dispatchModule(event: string, item: any) {
					moduleEvents.push({event, item});
				},
				dispatchUI(event: string, item: any) {
					uiEvents.push({event, item});
				},
				dispatchAll(event: string, item: any) {
					moduleEvents.push({event, item});
					uiEvents.push({event, item});
				}
			};
			const client = new HttpClient();
			client.setConfig({origin: 'http://127.0.0.1'});
			const api = new TestBaseApi(client);
			await api.init();
			api.setDispatcher(spy);
			const item = {_id: '1', name: 'a', __created: 1, __updated: 1, _v: 'v1'};
			await api.onEntriesUpdated([item]);
			return {moduleEvents, uiEvents};
		});
		expect(result.moduleEvents.length).toBeGreaterThan(0);
		expect(result.uiEvents.length).toBeGreaterThan(0);
		expect(result.moduleEvents.map((e: any) => e.event)).toContain('upsert-all');
	});

	test('onEntryDeleted dispatches when delete completes', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi, HttpClient} = (window as any).DbApiFrontend;
			const moduleEvents: { event: string }[] = [];
			const spy = {
				dispatchModule(event: string, _item: any) {
					moduleEvents.push({event});
				},
				dispatchUI(event: string, _item: any) {
					moduleEvents.push({event});
				},
				dispatchAll(_event: string, _item: any) {
				}
			};
			const deleted = {_id: '1', name: 'a', __created: 1, __updated: 1, _v: 'v1'};
			const client = new HttpClient();
			client.setConfig({origin: 'http://127.0.0.1'});
			(client as any).sendRequest = async () => ({data: deleted, status: 200, statusText: 'OK', headers: {}, config: {}});
			const api = new TestBaseApi(client);
			await api.init();
			api.setDispatcher(spy);
			await api.onEntriesUpdated([deleted]);
			await api.loadCache();
			await api.deleteUnique({_id: '1'});
			return {moduleEvents};
		});
		expect(result.moduleEvents.some((e: any) => e.event === 'delete')).toBe(true);
	});

	test('onQueryReturned dispatches when query completes', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi, HttpClient} = (window as any).DbApiFrontend;
			const moduleEvents: { event: string }[] = [];
			const spy = {
				dispatchModule(event: string, _item: any) {
					moduleEvents.push({event});
				},
				dispatchUI(event: string, _item: any) {
					moduleEvents.push({event});
				},
				dispatchAll(_event: string, _item: any) {
				}
			};
			const response = [{_id: '1', name: 'a', __created: 1, __updated: 1, _v: 'v1'}];
			const client = new HttpClient();
			client.setConfig({origin: 'http://127.0.0.1'});
			(client as any).sendRequest = async () => ({data: response, status: 200, statusText: 'OK', headers: {}, config: {}});
			const api = new TestBaseApi(client);
			await api.init();
			api.setDispatcher(spy);
			await api.query({});
			return {moduleEvents};
		});
		expect(result.moduleEvents.some((e: any) => e.event === 'query')).toBe(true);
	});

	test('upsert without _id dispatches create', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi, HttpClient} = (window as any).DbApiFrontend;
			const moduleEvents: { event: string }[] = [];
			const spy = {
				dispatchModule(event: string, _item: any) {
					moduleEvents.push({event});
				},
				dispatchUI(event: string, _item: any) {
					moduleEvents.push({event});
				},
				dispatchAll(_event: string, _item: any) {
				}
			};
			const created = {_id: '1', name: 'new', __created: 1, __updated: 1, _v: 'v1'};
			const client = new HttpClient();
			client.setConfig({origin: 'http://127.0.0.1'});
			(client as any).sendRequest = async () => ({data: created, status: 200, statusText: 'OK', headers: {}, config: {}});
			const api = new TestBaseApi(client);
			await api.init();
			api.setDispatcher(spy);
			await api.upsert({name: 'new'});
			return {moduleEvents};
		});
		expect(result.moduleEvents.some((e: any) => e.event === 'create')).toBe(true);
	});

	test('upsert with _id dispatches update', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi, HttpClient} = (window as any).DbApiFrontend;
			const moduleEvents: { event: string }[] = [];
			const spy = {
				dispatchModule(event: string, _item: any) {
					moduleEvents.push({event});
				},
				dispatchUI(event: string, _item: any) {
					moduleEvents.push({event});
				},
				dispatchAll(_event: string, _item: any) {
				}
			};
			const updated = {_id: '1', name: 'updated', __created: 1, __updated: 2, _v: 'v1'};
			const client = new HttpClient();
			client.setConfig({origin: 'http://127.0.0.1'});
			(client as any).sendRequest = async () => ({data: updated, status: 200, statusText: 'OK', headers: {}, config: {}});
			const api = new TestBaseApi(client);
			await api.init();
			api.setDispatcher(spy);
			await api.upsert({_id: '1', name: 'updated'});
			return {moduleEvents};
		});
		expect(result.moduleEvents.some((e: any) => e.event === 'update')).toBe(true);
	});

	test('patch dispatches patch event', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi, HttpClient} = (window as any).DbApiFrontend;
			const moduleEvents: { event: string }[] = [];
			const spy = {
				dispatchModule(event: string, _item: any) {
					moduleEvents.push({event});
				},
				dispatchUI(event: string, _item: any) {
					moduleEvents.push({event});
				},
				dispatchAll(_event: string, _item: any) {
				}
			};
			const patched = {_id: '1', name: 'patched', __created: 1, __updated: 2, _v: 'v1'};
			const client = new HttpClient();
			client.setConfig({origin: 'http://127.0.0.1'});
			(client as any).sendRequest = async () => ({data: patched, status: 200, statusText: 'OK', headers: {}, config: {}});
			const api = new TestBaseApi(client);
			await api.init();
			api.setDispatcher(spy);
			await api.patch({_id: '1', name: 'patched'});
			return {moduleEvents};
		});
		expect(result.moduleEvents.some((e: any) => e.event === 'patch')).toBe(true);
	});

	test('queryUnique dispatches unique event', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi, HttpClient} = (window as any).DbApiFrontend;
			const moduleEvents: { event: string }[] = [];
			const spy = {
				dispatchModule(event: string, _item: any) {
					moduleEvents.push({event});
				},
				dispatchUI(event: string, _item: any) {
					moduleEvents.push({event});
				},
				dispatchAll(_event: string, _item: any) {
				}
			};
			const item = {_id: '1', name: 'unique', __created: 1, __updated: 1, _v: 'v1'};
			const client = new HttpClient();
			client.setConfig({origin: 'http://127.0.0.1'});
			(client as any).sendRequest = async () => ({data: item, status: 200, statusText: 'OK', headers: {}, config: {}});
			const api = new TestBaseApi(client);
			await api.init();
			api.setDispatcher(spy);
			await api.queryUnique({_id: '1'});
			return {moduleEvents};
		});
		expect(result.moduleEvents.some((e: any) => e.event === 'unique')).toBe(true);
	});
});
