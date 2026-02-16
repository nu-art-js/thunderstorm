/*
 * Show – conditional render tests.
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('Show – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('Show.If condition true renders If child', async ({page}) => {
		const container = page.locator('[data-testid="show-if-true-container"]');
		await expect(container).toBeVisible();
		await expect(container.getByText('Show when true')).toBeVisible();
		await expect(container.getByText('Else')).not.toBeVisible();
	});

	test('Show.If condition false renders Else child', async ({page}) => {
		const container = page.locator('[data-testid="show-if-false-container"]');
		await expect(container).toBeVisible();
		await expect(container.getByText('Else content')).toBeVisible();
		await expect(container.getByText('Show when false')).not.toBeVisible();
	});
});
