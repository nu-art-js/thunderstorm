/*
 * CopyToClipboard – simple render tests.
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('CopyToClipboard – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('container is visible', async ({page}) => {
		await expect(page.locator('[data-testid="copy-to-clipboard-container"]')).toBeVisible();
	});
});
