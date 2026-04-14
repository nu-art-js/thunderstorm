/*
 * Overlay – click tests.
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('Overlay – click', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('child content is visible through overlay', async ({page}) => {
		const container = page.locator('[data-testid="overlay-container"]');
		await expect(container.getByTestId('overlay-child')).toBeVisible();
	});

	test('clicking overlay triggers callback', async ({page}) => {
		const container = page.locator('[data-testid="overlay-container"]');
		await expect(container.locator('.ts-overlay')).toBeVisible();
		await container.locator('.ts-overlay').click();
		await expect(container.locator('.ts-overlay')).not.toBeVisible();
	});
});
