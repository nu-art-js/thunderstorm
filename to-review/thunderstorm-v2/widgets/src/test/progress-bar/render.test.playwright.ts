/*
 * ProgressBar – render tests.
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('ProgressBar – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('progress bar is visible', async ({page}) => {
		const container = page.locator('[data-testid="loader-progress-container"]');
		await expect(container).toBeVisible();
	});
});
