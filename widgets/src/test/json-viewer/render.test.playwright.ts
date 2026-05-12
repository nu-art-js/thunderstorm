import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('JSONViewer – render – v1', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('json-viewer/entry--v1'));
		await waitForReady(page);
	});

	test('container is visible', async ({page}) => {
		const container = page.locator('[data-testid="json-viewer-v1-container"]');
		await expect(container).toBeVisible();
	});
});
