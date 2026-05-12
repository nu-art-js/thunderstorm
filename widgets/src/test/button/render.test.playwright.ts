/*
 * Button – simple render tests (v3).
 */
import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('Button v3 – render', () => {
	test('container and button are visible', async ({page}) => {
		await page.goto(testPage('button/entry--v3'));
		await waitForReady(page);
		const container = page.locator('[data-testid="button-v3-container"]');
		await expect(container).toBeVisible();
		await expect(container.getByRole('button', {name: 'Button v3'})).toBeVisible();
	});

	test('has ts-button class', async ({page}) => {
		await page.goto(testPage('button/entry--v3'));
		await waitForReady(page);
		const container = page.locator('[data-testid="button-v3-container"]');
		await expect(container.locator('button.ts-button')).toBeVisible();
	});
});
