/*
 * Dropdown – render tests.
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('Dropdown – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('dropdown closed by default, placeholder visible', async ({page}) => {
		const container = page.locator('[data-testid="dropdown-container"]');
		await expect(container).toBeVisible();
		await expect(container.getByText('Select option')).toBeVisible();
	});

	test('click opens list with items', async ({page}) => {
		const container = page.locator('[data-testid="dropdown-container"]');
		await container.click();
		await expect(container.getByText('Option A')).toBeVisible();
		await expect(container.getByText('Option B')).toBeVisible();
		await expect(container.getByText('Option C')).toBeVisible();
	});

	test('selecting item updates display', async ({page}) => {
		const container = page.locator('[data-testid="dropdown-container"]');
		await container.click();
		await container.getByText('Option B').click();
		await expect(container.getByText('Option B')).toBeVisible();
	});
});
