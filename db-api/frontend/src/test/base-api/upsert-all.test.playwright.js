/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */
import { expect, test } from '@playwright/test';
const testPagePath = '/src/test/index.html';
test.describe('BaseApi - upsertAll', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(testPagePath);
        await page.waitForFunction(() => window.DbApiFrontend !== undefined);
        await page.evaluate(() => window.DbApiFrontend.cleanupDbApiIDB());
    });
    test('upsertAll(body) and handleUpsertAllComplete', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { TestBaseApi, HttpClient } = window.DbApiFrontend;
            const response = [
                { _id: '1', name: 'a', __created: 1, __updated: 1, _v: 'v1' },
                { _id: '2', name: 'b', __created: 2, __updated: 2, _v: 'v1' }
            ];
            const client = new HttpClient();
            client.setConfig({ origin: 'http://127.0.0.1' });
            client.sendRequest = async () => ({ data: response, status: 200, statusText: 'OK', headers: {}, config: {} });
            const api = new TestBaseApi(client);
            await api.init();
            await api.upsertAll([{ _id: '1', name: 'a' }, { _id: '2', name: 'b' }]);
            const all = api.cache.all();
            return { length: all.length, items: all };
        });
        console.log('upsert-all items:', JSON.stringify(result.items));
        expect(result.length).toBe(2);
    });
});
//# sourceMappingURL=upsert-all.test.playwright.js.map