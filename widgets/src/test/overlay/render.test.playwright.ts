/*
 * Overlay – render tests.
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('Overlay – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('overlay visible when showOverlay true', async ({page}) => {
		const container = page.locator('[data-testid="overlay-container"]');
		await expect(container).toBeVisible();
		await expect(container.locator('.ts-overlay')).toBeVisible();
		await expect(container.getByText('Overlay child content')).toBeVisible();
	});

	test('toggle button hides overlay', async ({page}) => {
		const container = page.locator('[data-testid="overlay-container"]');
		await container.getByTestId('overlay-toggle').click();
		await expect(container.locator('.ts-overlay')).not.toBeVisible();
		await expect(container.getByText('Overlay child content')).toBeVisible();
	});
});
