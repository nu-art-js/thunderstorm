/*
 * ProgressBar – progress/segments tests.
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('ProgressBar – progress', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('progress bar has segments', async ({page}) => {
		const container = page.locator('[data-testid="loader-progress-container"]');
		await expect(container).toBeVisible();
		const bar = container.locator('[class*="progress"], [class*="linear"]');
		await expect(bar.first()).toBeVisible();
	});
});
