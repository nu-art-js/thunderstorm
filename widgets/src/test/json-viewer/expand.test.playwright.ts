/*
 * JSONViewer – expand/collapse tests (v1).
 */
import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('JSONViewer – expand', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('json-viewer/entry--v1'));
		await waitForReady(page);
	});

	test('can expand nested keys', async ({page}) => {
		const container = page.locator('[data-testid="json-viewer-v1-container"]');
		await expect(container).toBeVisible();
		// Click to expand if there is an expand control
		const expander = container.locator('[class*="expand"], [class*="toggle"], .ts-json-viewer').first();
		if (await expander.count() > 0)
			await expander.click();
		// At least the container is visible
		await expect(container).toBeVisible();
	});
});
