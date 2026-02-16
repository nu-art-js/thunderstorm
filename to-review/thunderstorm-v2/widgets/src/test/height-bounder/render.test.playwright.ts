/*
 * HeightBounder – render tests.
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('HeightBounder – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('container and content visible', async ({page}) => {
		const container = page.locator('[data-testid="height-bounder-container"]');
		await expect(container).toBeVisible();
		await expect(container.getByText('Height bounded content')).toBeVisible();
	});
});
