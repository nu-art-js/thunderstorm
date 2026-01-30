/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */
import { expect, test } from '@playwright/test';
const testPagePath = '/src/test/index.html';
test.describe('BaseDB - validation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(testPagePath);
        await page.waitForFunction(() => window.DbApiFrontend !== undefined);
        await page.evaluate(() => window.DbApiFrontend.cleanupDbApiIDB());
    });
    test('validateInternal with invalid data throws', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { TestBaseApiValidation } = window.DbApiFrontend;
            const api = new TestBaseApiValidation();
            await api.init();
            let thrown = false;
            try {
                api.validateInternalExposed({ _id: 'x', name: 'any' });
            }
            catch (_e) {
                thrown = true;
            }
            return { thrown };
        });
        expect(result.thrown).toBe(true);
    });
});
//# sourceMappingURL=validation.test.playwright.js.map