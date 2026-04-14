/*
 * Toaster – render tests.
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('Toaster – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('toast triggers are visible', async ({page}) => {
		const container = page.locator('[data-testid="toaster-demo-container"]');
		await expect(container).toBeVisible();
		await expect(container.getByTestId('toast-info-trigger')).toBeVisible();
		await expect(container.getByTestId('toast-success-trigger')).toBeVisible();
	});

	test('triggering toast shows content', async ({page}) => {
		await page.getByTestId('toast-info-trigger').click();
		await expect(page.locator('.ts-toaster')).toBeVisible();
		await expect(page.getByText('Info message')).toBeVisible();
	});
});
