/*
 * Dialog – render tests.
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('Dialog – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('dialog trigger button is visible', async ({page}) => {
		const container = page.locator('[data-testid="dialog-demo-container"]');
		await expect(container).toBeVisible();
		await expect(container.getByTestId('dialog-open-trigger')).toBeVisible();
		await expect(container.getByText('Open dialog')).toBeVisible();
	});

	test('opening dialog shows content', async ({page}) => {
		await page.getByTestId('dialog-open-trigger').click();
		await expect(page.getByTestId('test-dialog-content')).toBeVisible();
		await expect(page.getByText('Test dialog body')).toBeVisible();
	});

	test('close button closes dialog', async ({page}) => {
		await page.getByTestId('dialog-open-trigger').click();
		await expect(page.getByTestId('test-dialog-content')).toBeVisible();
		await page.getByRole('button', {name: 'Close'}).click();
		await expect(page.getByTestId('test-dialog-content')).not.toBeVisible();
	});
});
