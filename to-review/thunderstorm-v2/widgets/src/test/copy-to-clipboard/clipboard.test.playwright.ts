/*
 * CopyToClipboard – clipboard write test (v1).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('CopyToClipboard – clipboard', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('click copies text to clipboard', async ({page, context}) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		const container = page.locator('[data-testid="copy-to-clipboard-container"]');
		await expect(container).toBeVisible();
		await expect(container.getByText('Copy')).toBeVisible();
		await container.click();
		const clipboard = await page.evaluate(() => navigator.clipboard.readText());
		expect(clipboard).toBe('test');
	});
});
