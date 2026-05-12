import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('ListOrganizer – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('list-organizer/entry--v1'));
		await waitForReady(page);
	});

	test('container is visible', async ({page}) => {
		const container = page.locator('[data-testid="list-organizer-container"]');
		await expect(container).toBeVisible();
	});
});
