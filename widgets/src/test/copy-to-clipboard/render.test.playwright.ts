import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('CopyToClipboard – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('copy-to-clipboard/entry--v1'));
		await waitForReady(page);
	});

	test('container is visible', async ({page}) => {
		const container = page.locator('[data-testid="copy-to-clipboard-container"]');
		await expect(container).toBeVisible();
	});
});
