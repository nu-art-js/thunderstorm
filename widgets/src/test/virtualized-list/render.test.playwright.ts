import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('VirtualizedList – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('virtualized-list/entry--v1'));
		await waitForReady(page);
	});

	test('container is visible', async ({page}) => {
		const container = page.locator('[data-testid="virtualized-list-container"]');
		await expect(container).toBeVisible();
	});
});
