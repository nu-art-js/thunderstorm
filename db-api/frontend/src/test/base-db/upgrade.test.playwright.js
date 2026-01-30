/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */
import { expect, test } from '@playwright/test';
const testPagePath = '/src/test/index.html';
test.describe('BaseDB - upgrade', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(testPagePath);
        await page.waitForFunction(() => window.DbApiFrontend !== undefined);
        await page.evaluate(() => window.DbApiFrontend.cleanupDbApiIDB());
    });
    test('registerVersionUpgradeProcessor; load old-version data; loadCache runs upgrade and sets _v', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { TestBaseApiUpgrade } = window.DbApiFrontend;
            const api = new TestBaseApiUpgrade();
            await api.init();
            api.registerVersionUpgradeProcessor('v0', async (items) => {
                items.forEach((item) => {
                    item.name = (item.name ?? '') + '-upgraded';
                });
            });
            await api.onEntriesUpdated([{ _id: '1', name: 'old', __created: 1, __updated: 1, _v: 'v0' }]);
            await api.loadCache();
            const all = api.cache.all();
            const one = all.find((x) => x._id === '1');
            return { version: one?._v, name: one?.name };
        });
        expect(result.version).toBe('v1');
        expect(result.name).toBe('old-upgraded');
    });
});
//# sourceMappingURL=upgrade.test.playwright.js.map