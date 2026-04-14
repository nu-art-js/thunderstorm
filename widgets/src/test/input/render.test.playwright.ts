/*
 * Input – simple render tests (v1, v2, v3).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

const VERSIONS = ['v1', 'v2', 'v3'] as const;

test.describe('Input – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	for (const version of VERSIONS) {
		test(`${version}: container and input are visible`, async ({page}) => {
			const container = page.locator(`[data-testid="input-${version}-container"]`);
			await expect(container).toBeVisible();
			const input = page.locator(`#input-${version}`);
			await expect(input).toBeVisible();
		});
	}
});
