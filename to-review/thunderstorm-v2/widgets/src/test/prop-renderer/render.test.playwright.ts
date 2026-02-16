/*
 * PropRenderer – render tests.
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('PropRenderer – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('vertical: label and children visible', async ({page}) => {
		const container = page.locator('[data-testid="prop-renderer-vertical-container"]');
		await expect(container.getByText('Vertical label')).toBeVisible();
		await expect(container.getByText('Child')).toBeVisible();
	});

	test('horizontal: label and children visible', async ({page}) => {
		const container = page.locator('[data-testid="prop-renderer-horizontal-container"]');
		await expect(container.getByText('Horizontal label')).toBeVisible();
		await expect(container.getByText('Child')).toBeVisible();
	});

	test('flat: label and children visible', async ({page}) => {
		const container = page.locator('[data-testid="prop-renderer-flat-container"]');
		await expect(container.getByText('Flat label')).toBeVisible();
		await expect(container.getByText('Child')).toBeVisible();
	});
});
