/*
 * Button – simple render tests (v1, v3).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

const VERSIONS = ['v1', 'v3'] as const;

test.describe('Button – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	for (const version of VERSIONS) {
		test(`${version}: container and button are visible`, async ({page}) => {
			const container = page.locator(`[data-testid="button-${version}-container"]`);
			await expect(container).toBeVisible();
			await expect(container.getByRole('button', {name: `Button ${version}`})).toBeVisible();
		});

		test(`${version}: has ts-button class`, async ({page}) => {
			const container = page.locator(`[data-testid="button-${version}-container"]`);
			await expect(container.locator('button.ts-button')).toBeVisible();
		});
	}
});
