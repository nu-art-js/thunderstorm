import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('Tree – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('tree/entry--v1'));
		await waitForReady(page);
	});

	test('container is visible', async ({page}) => {
		const container = page.locator('[data-testid="tree-container"]');
		await expect(container).toBeVisible();
	});
});
