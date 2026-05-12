import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('Slider – value v3', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('slider/entry--v3'));
		await waitForReady(page);
	});

	test('slider has correct initial value', async ({page}) => {
		const slider = page.locator('[data-testid="slider-v3-container"] input[type="range"]');
		await expect(slider).toHaveValue('50');
	});
});
