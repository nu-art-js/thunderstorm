/*
 * Checkbox – toggle / checked state tests (v1, v2, v3).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

const VERSIONS = ['v1', 'v2', 'v3'] as const;

test.describe('Checkbox – toggle', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	for (const version of VERSIONS) {
		test(`${version}: can toggle checked state`, async ({page}) => {
			const container = page.locator(`[data-testid="checkbox-${version}-container"]`);
			await expect(container).toBeVisible();

			if (version === 'v1') {
				const wrapper = container.locator('.ts-checkbox').first();
				await wrapper.click();
				await expect(container.locator('.ts-checkbox__button__checked')).toBeVisible();
				await wrapper.click();
				await expect(container.locator('.ts-checkbox__button__unchecked')).toBeVisible();
			} else {
				const input = page.locator(`#checkbox-${version}`);
				await input.check();
				await expect(input).toBeChecked();
				await input.uncheck();
				await expect(input).not.toBeChecked();
			}
		});
	}
});
