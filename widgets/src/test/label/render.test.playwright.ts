/*
 * Label – simple render tests (v3).
 */
import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('Label – render – v3', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('label/entry--v3'));
		await waitForReady(page);
	});

	test('container and text are visible', async ({page}) => {
		const container = page.locator('[data-testid="label-v3-container"]');
		await expect(container).toBeVisible();
		await expect(container.getByText('Label v3 text')).toBeVisible();
	});
});
