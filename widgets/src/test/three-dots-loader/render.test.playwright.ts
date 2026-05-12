import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('ThreeDotsLoader – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('three-dots-loader/entry--v1'));
		await waitForReady(page);
	});

	test('container is visible', async ({page}) => {
		const container = page.locator('[data-testid="loader-three-dots-container"]');
		await expect(container).toBeVisible();
	});
});
