import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('Dialog – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('dialog/entry--v1'));
		await waitForReady(page);
	});

	test('container is visible', async ({page}) => {
		const container = page.locator('[data-testid="dialog-demo-container"]');
		await expect(container).toBeVisible();
	});

	test('open trigger is visible', async ({page}) => {
		const trigger = page.locator('[data-testid="dialog-open-trigger"]');
		await expect(trigger).toBeVisible();
	});
});
