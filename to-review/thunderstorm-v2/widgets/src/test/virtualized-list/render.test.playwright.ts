/*
 * VirtualizedList – render tests.
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('VirtualizedList – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('container and list are visible', async ({page}) => {
		const container = page.locator('[data-testid="virtualized-list-container"]');
		await expect(container).toBeVisible();
	});

	test('first item visible', async ({page}) => {
		const container = page.locator('[data-testid="virtualized-list-container"]');
		await expect(container.getByText('Item 0')).toBeVisible();
	});
});
