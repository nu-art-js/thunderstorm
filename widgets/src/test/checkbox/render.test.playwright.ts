/*
 * Checkbox – simple render tests (v3).
 */
import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('Checkbox v3 – render', () => {
	test('container is visible', async ({page}) => {
		await page.goto(testPage('checkbox/entry--v3'));
		await waitForReady(page);
		const container = page.locator('[data-testid="checkbox-v3-container"]');
		await expect(container).toBeVisible();
	});
});
