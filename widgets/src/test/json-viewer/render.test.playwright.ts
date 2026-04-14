/*
 * JSONViewer – render tests (v1).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('JSONViewer – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('root node visible', async ({page}) => {
		const container = page.locator('[data-testid="json-viewer-v1-container"]');
		await expect(container).toBeVisible();
	});
});
