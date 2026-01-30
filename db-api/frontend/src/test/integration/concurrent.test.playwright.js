/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */
import { expect, test } from '@playwright/test';
const testPagePath = '/src/test/index.html';
test.describe('Integration - concurrent operations', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(testPagePath);
        await page.waitForFunction(() => window.DbApiFrontend !== undefined);
        await page.evaluate(() => window.DbApiFrontend.cleanupDbApiIDB());
    });
    test('multiple upserts different ids complete and cache has both', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { TestBaseApi, HttpClient } = window.DbApiFrontend;
            const client = new HttpClient();
            client.setConfig({ origin: 'http://127.0.0.1' });
            client.sendRequest = async (req) => {
                const body = req?.data ?? {};
                const id = body._id ?? 'unknown';
                const name = body.name ?? 'unknown';
                return { data: { _id: id, name, __created: 1, __updated: 1, _v: 'v1' }, status: 200, statusText: 'OK', headers: {}, config: {} };
            };
            const api = new TestBaseApi(client);
            await api.init();
            await Promise.all([
                api.upsert({ _id: '1', name: 'a' }),
                api.upsert({ _id: '2', name: 'b' })
            ]);
            const all = api.cache.all();
            const ids = all.map((x) => x._id).sort();
            const names = all.map((x) => x.name).sort();
            return { length: all.length, ids, names };
        });
        expect(result.length).toBe(2);
        expect(result.ids).toEqual(['1', '2']);
        expect(result.names).toEqual(['a', 'b']);
    });
});
//# sourceMappingURL=concurrent.test.playwright.js.map