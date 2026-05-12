import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('Tabs – render – v1', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('tabs/entry--v1'));
		await waitForReady(page);
	});

	test('container is visible', async ({page}) => {
		const container = page.locator('[data-testid="tabs-v1-container"]');
		await expect(container).toBeVisible();
	});
});
