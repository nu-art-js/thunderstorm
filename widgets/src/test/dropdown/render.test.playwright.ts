import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('DropDown – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('dropdown/entry--v1'));
		await waitForReady(page);
	});

	test('container is visible', async ({page}) => {
		const container = page.locator('[data-testid="dropdown-container"]');
		await expect(container).toBeVisible();
	});
});
