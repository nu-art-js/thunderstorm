/*
 * ThreeDotsLoader – render tests.
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('ThreeDotsLoader – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('three dots loader is visible', async ({page}) => {
		const container = page.locator('[data-testid="loader-three-dots-container"]');
		await expect(container).toBeVisible();
	});
});
