/*
 * Link – simple render tests (v1, v3).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

const VERSIONS = ['v1', 'v3'] as const;

test.describe('Link – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	for (const version of VERSIONS) {
		test(`${version}: container and text are visible`, async ({page}) => {
			const container = page.locator(`[data-testid="link-${version}-container"]`);
			await expect(container).toBeVisible();
			await expect(container.getByText(`Link ${version}`)).toBeVisible();
		});

		test(`${version}: has clickable ts-link element`, async ({page}) => {
			const container = page.locator(`[data-testid="link-${version}-container"]`);
			await expect(container.locator('.ts-link')).toBeVisible();
		});
	}
});
