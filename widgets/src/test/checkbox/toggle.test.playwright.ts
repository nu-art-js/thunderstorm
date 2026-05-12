/*
 * Checkbox – toggle / checked state tests (v3).
 */
import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('Checkbox v3 – toggle', () => {
	test('can toggle checked state', async ({page}) => {
		await page.goto(testPage('checkbox/entry--v3'));
		await waitForReady(page);
		const container = page.locator('[data-testid="checkbox-v3-container"]');
		await expect(container).toBeVisible();
		const label = container.locator('label.ts-checkbox-v2');
		const input = container.locator('input[type="checkbox"]');
		await label.click();
		await expect(input).toBeChecked();
		await label.click();
		await expect(input).not.toBeChecked();
	});
});
