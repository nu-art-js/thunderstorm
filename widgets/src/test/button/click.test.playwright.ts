/*
 * Button – click, disabled, loading state tests (v1, v3).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

const VERSIONS = ['v1', 'v3'] as const;

test.describe('Button – click', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	for (const version of VERSIONS) {
		test(`${version}: click fires callback`, async ({page}) => {
			const container = page.locator(`[data-testid="button-${version}-container"]`);
			const btn = container.getByRole('button', {name: `Button ${version}`});
			await expect(btn).toBeVisible();
			await btn.click();
			// Callback is no-op; just ensure no throw and button still visible
			await expect(btn).toBeVisible();
		});

		test(`${version}: disabled button is not clickable`, async ({page}) => {
			const container = page.locator(`[data-testid="button-${version}-disabled-container"]`);
			const btn = container.getByRole('button', {name: `Button ${version} disabled`});
			await expect(btn).toBeVisible();
			await expect(btn).toBeDisabled();
		});

		test(`${version}: loading state renders action-in-progress`, async ({page}) => {
			const container = page.locator(`[data-testid="button-${version}-loading-container"]`);
			const btn = container.getByRole('button');
			await expect(btn).toBeVisible();
			await expect(container.locator('.ts-button.action-in-progress')).toBeVisible();
		});
	}
});
