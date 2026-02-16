/*
 * Layouts – structure and children tests (v1, v3).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

const VERSIONS = ['v1', 'v3'] as const;

test.describe('Layouts – structure', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	for (const version of VERSIONS) {
		test(`${version}: children are in correct DOM order`, async ({page}) => {
			const container = page.locator(`[data-testid="layouts-${version}-container"]`);
			await expect(container).toBeVisible();
			const spans = container.locator('span');
			await expect(spans.nth(0)).toHaveText('A');
			await expect(spans.nth(1)).toHaveText('B');
		});

		test(`${version}: layout has expected class`, async ({page}) => {
			const container = page.locator(`[data-testid="layouts-${version}-container"]`);
			await expect(container.locator('.ll_v_l')).toBeVisible();
			await expect(container.locator(`.layouts-${version}-demo`)).toBeVisible();
		});
	}
});
