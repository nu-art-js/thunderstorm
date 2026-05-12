import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('ReadMore – render v3', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('read-more/entry--v3'));
		await waitForReady(page);
	});

	test('container is visible', async ({page}) => {
		const container = page.locator('[data-testid="read-more-v3-container"]');
		await expect(container).toBeVisible();
	});
});
