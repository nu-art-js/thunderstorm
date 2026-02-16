/*
 * Label – content and className tests (v1, v3).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

const VERSIONS = ['v1', 'v3'] as const;

test.describe('Label – content', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	for (const version of VERSIONS) {
		test(`${version}: children text is rendered`, async ({page}) => {
			const container = page.locator(`[data-testid="label-${version}-container"]`);
			await expect(container).toBeVisible();
			await expect(container.getByText('Label v1 text')).toBeVisible();
		});

		test(`${version}: className is applied when provided`, async ({page}) => {
			const container = page.locator(`[data-testid="label-${version}-custom-class-container"]`);
			await expect(container).toBeVisible();
			await expect(container.locator('.label-custom-class')).toBeVisible();
		});
	}
});
