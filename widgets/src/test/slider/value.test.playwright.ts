/*
 * Slider – value interaction tests (v1, v3).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

const VERSIONS = ['v1', 'v3'] as const;

test.describe('Slider – value', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	for (const version of VERSIONS) {
		test(`${version}: initial value is rendered`, async ({page}) => {
			const container = page.locator(`[data-testid="slider-${version}-container"]`);
			await expect(container).toBeVisible();
			const valueInput = container.locator('.ts-slider__current-value');
			await expect(valueInput).toBeVisible();
			await expect(valueInput).toHaveValue('50');
		});

		test(`${version}: range input respects min and max`, async ({page}) => {
			const container = page.locator(`[data-testid="slider-${version}-container"]`);
			const rangeInput = container.locator('input[type="range"]');
			await expect(rangeInput).toHaveAttribute('min', '0');
			await expect(rangeInput).toHaveAttribute('max', '100');
		});

		test(`${version}: changing value input updates display`, async ({page}) => {
			const container = page.locator(`[data-testid="slider-${version}-container"]`);
			const valueInput = container.locator('.ts-slider__current-value');
			await valueInput.fill('75');
			await expect(valueInput).toHaveValue('75');
		});
	}
});
