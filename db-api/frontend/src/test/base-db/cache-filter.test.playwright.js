/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */
import { expect, test } from '@playwright/test';
const testPagePath = '/src/test/index.html';
test.describe('BaseDB - cache filter', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(testPagePath);
        await page.waitForFunction(() => window.DbApiFrontend !== undefined);
        await page.evaluate(() => window.DbApiFrontend.cleanupDbApiIDB());
    });
    test('loadCache with filter loads only items passing the filter', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { TestBaseApi } = window.DbApiFrontend;
            const api = new TestBaseApi();
            await api.init();
            await api.onEntriesUpdated([
                { _id: '1', name: 'keep', __created: 1, __updated: 1, _v: 'v1' },
                { _id: '2', name: 'skip', __created: 2, __updated: 2, _v: 'v1' },
                { _id: '3', name: 'keep', __created: 3, __updated: 3, _v: 'v1' }
            ]);
            await api.loadCache((item) => item.name === 'keep');
            const all = api.cache.all();
            return { length: all.length, names: all.map((x) => x.name) };
        });
        expect(result.length).toBe(2);
        expect(result.names).toEqual(['keep', 'keep']);
    });
});
//# sourceMappingURL=cache-filter.test.playwright.js.map