import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('Toaster – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('toaster/entry--v1'));
		await waitForReady(page);
	});

	test('container is visible', async ({page}) => {
		const container = page.locator('[data-testid="toaster-demo-container"]');
		await expect(container).toBeVisible();
	});

	test('info trigger is visible', async ({page}) => {
		const trigger = page.locator('[data-testid="toast-info-trigger"]');
		await expect(trigger).toBeVisible();
	});

	test('success trigger is visible', async ({page}) => {
		const trigger = page.locator('[data-testid="toast-success-trigger"]');
		await expect(trigger).toBeVisible();
	});
});
