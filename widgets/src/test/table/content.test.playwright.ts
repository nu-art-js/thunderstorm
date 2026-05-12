/*
 * Table – content tests (v1).
 */
import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('Table – content', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('table/entry--v1'));
		await waitForReady(page);
	});

	test('cell content matches data', async ({page}) => {
		const container = page.locator('[data-testid="table-v1-container"]');
		await expect(container.getByText('1', {exact: true})).toBeVisible();
		await expect(container.getByText('2', {exact: true})).toBeVisible();
	});
});
