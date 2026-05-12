/*
 * CheckboxGroup – simple render tests (v3).
 */
import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('CheckboxGroup v3 – render', () => {
	test('container and group are visible', async ({page}) => {
		await page.goto(testPage('checkbox-group/entry--v3'));
		await waitForReady(page);
		const container = page.locator('[data-testid="checkbox-group-v3-container"]');
		await expect(container).toBeVisible();
		await expect(container.locator('.ts-checkbox-group')).toBeVisible();
	});
});
