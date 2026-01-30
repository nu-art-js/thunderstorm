/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */
import { expect, test } from '@playwright/test';
const testPagePath = '/src/test/index.html';
test.describe('BaseApi - deleteAll', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(testPagePath);
        await page.waitForFunction(() => window.DbApiFrontend !== undefined);
        await page.evaluate(() => window.DbApiFrontend.cleanupDbApiIDB());
    });
    test('deleteAll() completes without error', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { TestBaseApi, HttpClient } = window.DbApiFrontend;
            const client = new HttpClient();
            client.setConfig({ origin: 'http://127.0.0.1' });
            client.sendRequest = async () => ({ data: undefined, status: 200, statusText: 'OK', headers: {}, config: {} });
            const api = new TestBaseApi(client);
            await api.init();
            await api.deleteAll();
            return { ok: true };
        });
        expect(result.ok).toBe(true);
    });
    test('deleteAll with pre-populated cache does not clear cache (no onComplete)', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { TestBaseApi, HttpClient } = window.DbApiFrontend;
            const client = new HttpClient();
            client.setConfig({ origin: 'http://127.0.0.1' });
            client.sendRequest = async () => ({ data: undefined, status: 200, statusText: 'OK', headers: {}, config: {} });
            const api = new TestBaseApi(client);
            await api.init();
            await api.onEntriesUpdated([{ _id: '1', name: 'a', __created: 1, __updated: 1, _v: 'v1' }]);
            await api.loadCache();
            const beforeLength = api.cache.all().length;
            await api.deleteAll();
            const afterLength = api.cache.all().length;
            return { beforeLength, afterLength };
        });
        expect(result.beforeLength).toBe(1);
        expect(result.afterLength).toBe(1);
    });
});
//# sourceMappingURL=delete-all.test.playwright.js.map