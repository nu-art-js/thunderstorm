/*
 * CircularLoader – render tests.
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('CircularLoader – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('circular loader is visible', async ({page}) => {
		const container = page.locator('[data-testid="loader-circular-container"]');
		await expect(container).toBeVisible();
	});
});
