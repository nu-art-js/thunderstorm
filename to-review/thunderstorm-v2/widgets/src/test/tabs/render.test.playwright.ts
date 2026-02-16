/*
 * Tabs – render tests (v1).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('Tabs – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('tab headers are visible', async ({page}) => {
		const container = page.locator('[data-testid="tabs-v1-container"]');
		await expect(container).toBeVisible();
		await expect(container.getByText('Tab 1')).toBeVisible();
		await expect(container.getByText('Tab 2')).toBeVisible();
		await expect(container.getByText('Tab 3')).toBeVisible();
	});

	test('first tab content is visible', async ({page}) => {
		const container = page.locator('[data-testid="tabs-v1-container"]');
		await expect(container.getByText('Content 1')).toBeVisible();
	});
});
