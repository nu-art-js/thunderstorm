/*
 * Layouts – simple render tests (v1, v3).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

const VERSIONS = ['v1', 'v3'] as const;

test.describe('Layouts – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	for (const version of VERSIONS) {
		test(`${version}: container and children A, B are visible`, async ({page}) => {
			const container = page.locator(`[data-testid="layouts-${version}-container"]`);
			await expect(container).toBeVisible();
			await expect(container.getByText('A')).toBeVisible();
			await expect(container.getByText('B')).toBeVisible();
		});
	}
});
