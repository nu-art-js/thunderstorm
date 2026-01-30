/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */
import { expect, test } from '@playwright/test';
const testPagePath = '/src/test/index.html';
test.describe('BaseDB - loadCache', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(testPagePath);
        await page.waitForFunction(() => window.DbApiFrontend !== undefined);
        await page.evaluate(() => window.DbApiFrontend.cleanupDbApiIDB());
    });
    test('after seeding IDB, loadCache() fills cache with expected length and contents', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { TestBaseApi } = window.DbApiFrontend;
            const api = new TestBaseApi();
            await api.init();
            const seed = [
                { _id: '1', name: 'a', __created: 1, __updated: 1, _v: 'v1' },
                { _id: '2', name: 'b', __created: 2, __updated: 2, _v: 'v1' }
            ];
            await api.onEntriesUpdated(seed);
            await api.loadCache();
            const all = api.cache.all();
            return { length: all.length, items: all };
        });
        expect(result.length).toBe(2);
        expect(result.items).toContainEqual(expect.objectContaining({ _id: '1', name: 'a' }));
        expect(result.items).toContainEqual(expect.objectContaining({ _id: '2', name: 'b' }));
    });
    test('loadCache with empty IDB leaves cache empty', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { TestBaseApi, HttpClient } = window.DbApiFrontend;
            const client = new HttpClient();
            client.setConfig({ origin: 'http://127.0.0.1' });
            const api = new TestBaseApi(client);
            await api.init();
            await api.loadCache();
            return { length: api.cache.all().length };
        });
        expect(result.length).toBe(0);
    });
    test('clearData then loadCache leaves cache empty', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { TestBaseApi, HttpClient } = window.DbApiFrontend;
            const client = new HttpClient();
            client.setConfig({ origin: 'http://127.0.0.1' });
            const api = new TestBaseApi(client);
            await api.init();
            await api.onEntriesUpdated([{ _id: '1', name: 'x', __created: 1, __updated: 1, _v: 'v1' }]);
            await api.loadCache();
            await api.clearData();
            await api.loadCache();
            return { length: api.cache.all().length };
        });
        expect(result.length).toBe(0);
    });
});
//# sourceMappingURL=load-cache.test.playwright.js.map