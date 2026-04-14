/*
 * Radio – selection tests (v1, v3).
 * TS_Radio uses custom labels/spans (no native input); selection is reflected by .ts-radio__container.checked.
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

const VERSIONS = ['v1', 'v3'] as const;

test.describe('Radio – selection', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	for (const version of VERSIONS) {
		test(`${version}: initial selection has checked class`, async ({page}) => {
			const container = page.locator(`[data-testid="radio-${version}-container"]`);
			await expect(container).toBeVisible();
			await expect(container.locator('.ts-radio__container.checked').first()).toBeVisible();
		});

		test(`${version}: clicking option b selects it`, async ({page}) => {
			const container = page.locator(`[data-testid="radio-${version}-container"]`);
			const optionB = container.locator('.ts-radio__container').filter({has: page.locator('text=b')}).first();
			await optionB.click();
			await expect(optionB).toHaveClass(/checked/);
		});

		test(`${version}: selecting one deselects the other`, async ({page}) => {
			const container = page.locator(`[data-testid="radio-${version}-container"]`);
			const optionA = container.locator('.ts-radio__container').filter({has: page.locator('text=a')}).first();
			const optionB = container.locator('.ts-radio__container').filter({has: page.locator('text=b')}).first();
			await optionB.click();
			await expect(optionB).toHaveClass(/checked/);
			await expect(optionA).not.toHaveClass(/checked/);
			await optionA.click();
			await expect(optionA).toHaveClass(/checked/);
			await expect(optionB).not.toHaveClass(/checked/);
		});
	}
});
