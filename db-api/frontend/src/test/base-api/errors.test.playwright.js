/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */
import { expect, test } from '@playwright/test';
const testPagePath = '/src/test/index.html';
test.describe('BaseApi - error handling', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(testPagePath);
        await page.waitForFunction(() => window.DbApiFrontend !== undefined);
        await page.evaluate(() => window.DbApiFrontend.cleanupDbApiIDB());
    });
    test('HTTP error on query: promise rejects and cache unchanged', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { TestBaseApi, HttpClient } = window.DbApiFrontend;
            const client = new HttpClient();
            client.setConfig({ origin: 'http://127.0.0.1' });
            client.sendRequest = async () => {
                throw new Error('Network error');
            };
            const api = new TestBaseApi(client);
            await api.init();
            let thrown = false;
            let message = '';
            try {
                await api.query({});
            }
            catch (e) {
                thrown = true;
                message = e?.message ?? '';
            }
            const cacheLength = api.cache.all().length;
            return { thrown, message, cacheLength };
        });
        expect(result.thrown).toBe(true);
        expect(result.cacheLength).toBe(0);
    });
    test('HTTP 500 on query: promise rejects and cache unchanged', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { TestBaseApi, HttpClient } = window.DbApiFrontend;
            const client = new HttpClient();
            client.setConfig({ origin: 'http://127.0.0.1' });
            client.sendRequest = async () => ({
                data: null,
                status: 500,
                statusText: 'Internal Server Error',
                headers: {},
                config: {}
            });
            const api = new TestBaseApi(client);
            await api.init();
            let thrown = false;
            try {
                await api.query({});
            }
            catch (_e) {
                thrown = true;
            }
            return { thrown, cacheLength: api.cache.all().length };
        });
        expect(result.thrown).toBe(true);
        expect(result.cacheLength).toBe(0);
    });
    test('HTTP error on upsert: promise rejects and cache not updated', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { TestBaseApi, HttpClient } = window.DbApiFrontend;
            const client = new HttpClient();
            client.setConfig({ origin: 'http://127.0.0.1' });
            client.sendRequest = async () => {
                throw new Error('Upsert failed');
            };
            const api = new TestBaseApi(client);
            await api.init();
            let thrown = false;
            try {
                await api.upsert({ _id: '1', name: 'should not appear' });
            }
            catch (_e) {
                thrown = true;
            }
            const all = api.cache.all();
            return { thrown, cacheLength: all.length, hasItem: all.some((x) => x._id === '1') };
        });
        expect(result.thrown).toBe(true);
        expect(result.cacheLength).toBe(0);
        expect(result.hasItem).toBe(false);
    });
    test('HTTP error on delete: promise rejects and cache not updated', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { TestBaseApi, HttpClient } = window.DbApiFrontend;
            const existing = { _id: '1', name: 'a', __created: 1, __updated: 1, _v: 'v1' };
            const client = new HttpClient();
            client.setConfig({ origin: 'http://127.0.0.1' });
            client.sendRequest = async () => {
                throw new Error('Delete failed');
            };
            const api = new TestBaseApi(client);
            await api.init();
            await api.onEntriesUpdated([existing]);
            await api.loadCache();
            const beforeLength = api.cache.all().length;
            let thrown = false;
            try {
                await api.delete({ _id: '1' });
            }
            catch (_e) {
                thrown = true;
            }
            const afterLength = api.cache.all().length;
            const stillHas = api.cache.all().some((x) => x._id === '1');
            return { thrown, beforeLength, afterLength, stillHas };
        });
        expect(result.thrown).toBe(true);
        expect(result.beforeLength).toBe(1);
        expect(result.afterLength).toBe(1);
        expect(result.stillHas).toBe(true);
    });
    test('HTTP error on patch: promise rejects and cache not updated', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { TestBaseApi, HttpClient } = window.DbApiFrontend;
            const existing = { _id: '1', name: 'original', __created: 1, __updated: 1, _v: 'v1' };
            const client = new HttpClient();
            client.setConfig({ origin: 'http://127.0.0.1' });
            client.sendRequest = async () => {
                throw new Error('Patch failed');
            };
            const api = new TestBaseApi(client);
            await api.init();
            await api.onEntriesUpdated([existing]);
            await api.loadCache();
            let thrown = false;
            try {
                await api.patch({ _id: '1', name: 'patched' });
            }
            catch (_e) {
                thrown = true;
            }
            const item = api.cache.all().find((x) => x._id === '1');
            return { thrown, name: item?.name };
        });
        expect(result.thrown).toBe(true);
        expect(result.name).toBe('original');
    });
    test('HTTP error on upsertAll: promise rejects and cache not updated', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { TestBaseApi, HttpClient } = window.DbApiFrontend;
            const client = new HttpClient();
            client.setConfig({ origin: 'http://127.0.0.1' });
            client.sendRequest = async () => {
                throw new Error('UpsertAll failed');
            };
            const api = new TestBaseApi(client);
            await api.init();
            let thrown = false;
            try {
                await api.upsertAll([
                    { _id: '1', name: 'a' },
                    { _id: '2', name: 'b' }
                ]);
            }
            catch (_e) {
                thrown = true;
            }
            const all = api.cache.all();
            return { thrown, cacheLength: all.length, has1: all.some((x) => x._id === '1'), has2: all.some((x) => x._id === '2') };
        });
        expect(result.thrown).toBe(true);
        expect(result.cacheLength).toBe(0);
        expect(result.has1).toBe(false);
        expect(result.has2).toBe(false);
    });
    test('HTTP error on deleteQuery: promise rejects and cache unchanged', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { TestBaseApi, HttpClient } = window.DbApiFrontend;
            const existing = { _id: '1', name: 'a', __created: 1, __updated: 1, _v: 'v1' };
            const client = new HttpClient();
            client.setConfig({ origin: 'http://127.0.0.1' });
            client.sendRequest = async () => {
                throw new Error('DeleteQuery failed');
            };
            const api = new TestBaseApi(client);
            await api.init();
            await api.onEntriesUpdated([existing]);
            await api.loadCache();
            const beforeLength = api.cache.all().length;
            let thrown = false;
            try {
                await api.deleteQuery({});
            }
            catch (_e) {
                thrown = true;
            }
            const afterLength = api.cache.all().length;
            const stillHas = api.cache.all().some((x) => x._id === '1');
            return { thrown, beforeLength, afterLength, stillHas };
        });
        expect(result.thrown).toBe(true);
        expect(result.beforeLength).toBe(1);
        expect(result.afterLength).toBe(1);
        expect(result.stillHas).toBe(true);
    });
});
//# sourceMappingURL=errors.test.playwright.js.map