/*
 * Tabs – selection tests (v1).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('Tabs – selection', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('clicking Tab 2 switches content', async ({page}) => {
		const container = page.locator('[data-testid="tabs-v1-container"]');
		await container.getByText('Tab 2').click();
		await expect(container.getByText('Content 2')).toBeVisible();
	});

	test('disabled tab is present', async ({page}) => {
		const container = page.locator('[data-testid="tabs-v1-container"]');
		await expect(container.getByText('Tab 3')).toBeVisible();
	});
});
