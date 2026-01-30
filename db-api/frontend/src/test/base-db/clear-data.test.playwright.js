/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */
import { expect, test } from '@playwright/test';
const testPagePath = '/src/test/index.html';
test.describe('BaseDB - clearData', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(testPagePath);
        await page.waitForFunction(() => window.DbApiFrontend !== undefined);
        await page.evaluate(() => window.DbApiFrontend.cleanupDbApiIDB());
    });
    test('after loading data, clearData() empties IDB and cache', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { TestBaseApi } = window.DbApiFrontend;
            const api = new TestBaseApi();
            await api.init();
            await api.onEntriesUpdated([{ _id: '1', name: 'x', __created: 1, __updated: 1, _v: 'v1' }]);
            await api.loadCache();
            const cacheBefore = api.cache.all().length;
            await api.clearData();
            const cacheAfter = api.cache.all().length;
            const idbCount = await api.IDB.getAll().then((a) => a.length);
            return { cacheBefore, cacheAfter, idbCount };
        });
        expect(result.cacheBefore).toBe(1);
        expect(result.cacheAfter).toBe(0);
        expect(result.idbCount).toBe(0);
    });
});
//# sourceMappingURL=clear-data.test.playwright.js.map