/*
 * CollapsableContainer – expanded state tests (v1, v2, v3).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

const VERSIONS = ['v1', 'v2', 'v3'] as const;

test.describe('CollapsableContainer – expanded', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	for (const version of VERSIONS) {
		test(`${version}: header and content visible when expanded`, async ({page}) => {
			const container = page.locator(`[data-testid="collapsable-${version}-container"]`);
			await expect(container).toBeVisible();
			await expect(container.locator('text=Header ' + version)).toBeVisible();
			await expect(container.locator('text=Content ' + version)).toBeVisible();
		});
	}
});
