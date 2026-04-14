/*
 * ComponentTransition – trigger behavior tests (v1, v3).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

const VERSIONS = ['v1', 'v3'] as const;

test.describe('ComponentTransition – trigger', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	for (const version of VERSIONS) {
		test(`${version}: trigger true shows content`, async ({page}) => {
			const container = page.locator(`[data-testid="component-transition-${version}-container"]`);
			await expect(container).toBeVisible();
			await expect(container.getByText(`Transition ${version}`)).toBeVisible();
		});

		test(`${version}: trigger false hides content`, async ({page}) => {
			const container = page.locator(`[data-testid="component-transition-${version}-hidden-container"]`);
			await expect(container).toBeVisible();
			await expect(container.getByText(`Transition ${version} hidden`)).not.toBeVisible();
		});
	}
});
