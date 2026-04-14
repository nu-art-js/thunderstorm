/*
 * ErrorBoundary – render tests.
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('ErrorBoundary – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('error-free child renders normally', async ({page}) => {
		const container = page.locator('[data-testid="error-boundary-ok-container"]');
		await expect(container).toBeVisible();
		await expect(container.getByText('No error')).toBeVisible();
	});

	test('error child shows error UI', async ({page}) => {
		const container = page.locator('[data-testid="error-boundary-catch-container"]');
		await expect(container).toBeVisible();
		await expect(container.locator('.ts-error-boundary')).toBeVisible();
	});
});
