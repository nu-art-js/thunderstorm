/*
 * Table – content tests (v1).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('Table – content', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('cell content matches data', async ({page}) => {
		const container = page.locator('[data-testid="table-v1-container"]');
		await expect(container.getByText('1')).toBeVisible();
		await expect(container.getByText('2')).toBeVisible();
	});
});
