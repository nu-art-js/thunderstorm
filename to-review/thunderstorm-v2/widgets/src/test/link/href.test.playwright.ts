/*
 * Link – href, target, children tests (v1, v3).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

const VERSIONS = ['v1', 'v3'] as const;

test.describe('Link – href', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	for (const version of VERSIONS) {
		test(`${version}: children text is rendered`, async ({page}) => {
			const container = page.locator(`[data-testid="link-${version}-container"]`);
			await expect(container).toBeVisible();
			await expect(container.getByText(`Link ${version}`)).toBeVisible();
		});

		test(`${version}: has ts-link class`, async ({page}) => {
			const container = page.locator(`[data-testid="link-${version}-container"]`);
			await expect(container.locator('.ts-link')).toBeVisible();
		});

		test(`${version}: link is clickable`, async ({page}) => {
			const container = page.locator(`[data-testid="link-${version}-container"]`);
			const link = container.locator('.ts-link');
			await expect(link).toBeVisible();
			await link.click();
			// No navigation in test env; just ensure no throw
			await expect(link).toBeVisible();
		});
	}
});
