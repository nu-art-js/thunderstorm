/*
 * Label – content and className tests (v3).
 */
import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('Label – content – v3', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('label/entry--v3'));
		await waitForReady(page);
	});

	test('children text is rendered', async ({page}) => {
		const container = page.locator('[data-testid="label-v3-container"]');
		await expect(container).toBeVisible();
		await expect(container.getByText('Label v3 text')).toBeVisible();
	});

	test('className is applied when provided', async ({page}) => {
		const container = page.locator('[data-testid="label-v3-custom-class-container"]');
		await expect(container).toBeVisible();
		await expect(container.locator('.label-custom-class')).toBeVisible();
	});
});
