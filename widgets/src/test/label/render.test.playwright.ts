/*
 * Label – simple render tests (v1, v3).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

const VERSIONS = ['v1', 'v3'] as const;

test.describe('Label – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	for (const version of VERSIONS) {
		test(`${version}: container and text are visible`, async ({page}) => {
			const container = page.locator(`[data-testid="label-${version}-container"]`);
			await expect(container).toBeVisible();
			await expect(container.getByText(`Label ${version} text`)).toBeVisible();
		});
	}
});
