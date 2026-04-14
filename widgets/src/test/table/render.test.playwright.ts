/*
 * Table – render tests (v1).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('Table – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('headers render', async ({page}) => {
		const container = page.locator('[data-testid="table-v1-container"]');
		await expect(container).toBeVisible();
		await expect(container.locator('.ts-table__head')).toBeVisible();
		await expect(container.getByText('name')).toBeVisible();
		await expect(container.getByText('value')).toBeVisible();
	});

	test('rows render', async ({page}) => {
		const container = page.locator('[data-testid="table-v1-container"]');
		await expect(container.getByText('Row1')).toBeVisible();
		await expect(container.getByText('Row2')).toBeVisible();
	});

	test('correct cell count', async ({page}) => {
		const container = page.locator('[data-testid="table-v1-container"]');
		const cells = container.locator('.ts-table__td');
		await expect(cells).toHaveCount(4);
	});
});
