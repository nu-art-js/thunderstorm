/*
 * ComponentTransition – simple render tests (v1, v3).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('ComponentTransition – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('v1 container is visible', async ({page}) => {
		await expect(page.locator('[data-testid="component-transition-v1-container"]')).toBeVisible();
	});

	test('v3 container is visible', async ({page}) => {
		await expect(page.locator('[data-testid="component-transition-v3-container"]')).toBeVisible();
	});
});
