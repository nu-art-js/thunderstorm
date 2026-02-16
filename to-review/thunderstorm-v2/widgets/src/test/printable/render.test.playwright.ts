/*
 * Printable – simple render tests (v1, v3).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

const VERSIONS = ['v1', 'v3'] as const;

test.describe('Printable – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	for (const version of VERSIONS) {
		test(`${version}: container and text are visible`, async ({page}) => {
			const container = page.locator(`[data-testid="printable-${version}-container"]`);
			await expect(container).toBeVisible();
			await expect(container.getByText(`Printable ${version}`)).toBeVisible();
		});

		test(`${version}: has ts-printable root`, async ({page}) => {
			const container = page.locator(`[data-testid="printable-${version}-container"]`);
			await expect(container.locator('.ts-printable')).toBeVisible();
		});
	}
});
