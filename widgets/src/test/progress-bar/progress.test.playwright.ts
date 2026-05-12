/*
 * ProgressBar – progress/segments tests.
 */
import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('ProgressBar – progress', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('progress-bar/entry--v1'));
		await waitForReady(page);
	});

	test('progress bar has segments', async ({page}) => {
		const container = page.locator('[data-testid="loader-progress-container"]');
		await expect(container).toBeVisible();
		const bar = container.locator('[class*="progress"], [class*="linear"]');
		await expect(bar.first()).toBeVisible();
	});
});
