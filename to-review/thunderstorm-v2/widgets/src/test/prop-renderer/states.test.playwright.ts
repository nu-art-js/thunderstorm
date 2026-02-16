/*
 * PropRenderer – error and disabled state tests.
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('PropRenderer – states', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('error message is rendered', async ({page}) => {
		const container = page.locator('[data-testid="prop-renderer-error-container"]');
		await expect(container.getByText('Error message')).toBeVisible();
		await expect(container.locator('.ts-prop-renderer__error')).toBeVisible();
	});

	test('disabled state has disabled class', async ({page}) => {
		const container = page.locator('[data-testid="prop-renderer-disabled-container"]');
		await expect(container.locator('.ts-prop-renderer.disabled')).toBeVisible();
	});
});
