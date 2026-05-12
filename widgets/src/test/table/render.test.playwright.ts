import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('Table – render – v1', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('table/entry--v1'));
		await waitForReady(page);
	});

	test('container is visible', async ({page}) => {
		const container = page.locator('[data-testid="table-v1-container"]');
		await expect(container).toBeVisible();
	});
});
