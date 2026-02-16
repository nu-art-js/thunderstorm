/*
 * Checkbox – simple render tests (v1, v2, v3).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

const VERSIONS = ['v1', 'v2', 'v3'] as const;

test.describe('Checkbox – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	for (const version of VERSIONS) {
		test(`${version}: container is visible`, async ({page}) => {
			const container = page.locator(`[data-testid="checkbox-${version}-container"]`);
			await expect(container).toBeVisible();
		});
	}
});
