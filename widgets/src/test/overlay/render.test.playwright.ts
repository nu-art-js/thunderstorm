import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('Overlay – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('overlay/entry--v1'));
		await waitForReady(page);
	});

	test('container is visible', async ({page}) => {
		const container = page.locator('[data-testid="overlay-container"]');
		await expect(container).toBeVisible();
	});

	test('toggle button is visible', async ({page}) => {
		const toggle = page.locator('[data-testid="overlay-toggle"]');
		await expect(toggle).toBeVisible();
	});
});
