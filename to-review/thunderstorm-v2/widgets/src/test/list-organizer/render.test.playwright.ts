/*
 * ListOrganizer – render tests.
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('ListOrganizer – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('items visible in order', async ({page}) => {
		const container = page.locator('[data-testid="list-organizer-container"]');
		await expect(container).toBeVisible();
		await expect(container.getByText('First')).toBeVisible();
		await expect(container.getByText('Second')).toBeVisible();
		await expect(container.getByText('Third')).toBeVisible();
	});
});
