/*
 * Toggle – toggle state tests (v1, v3).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

const VERSIONS = ['v1', 'v3'] as const;

test.describe('Toggle – toggle', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	for (const version of VERSIONS) {
		test(`${version}: click toggles checked state`, async ({page}) => {
			const container = page.locator(`[data-testid="toggle-${version}-container"]`);
			await expect(container).toBeVisible();
			const toggleInput = container.locator('.ts-toggle__checkbox');
			await expect(toggleInput).toBeVisible();
			const initiallyChecked = await toggleInput.isChecked();
			await container.locator('.ts-toggle').first().click();
			await expect(toggleInput).toBeChecked({checked: !initiallyChecked});
			await container.locator('.ts-toggle').first().click();
			await expect(toggleInput).toBeChecked({checked: initiallyChecked});
		});
	}
});
