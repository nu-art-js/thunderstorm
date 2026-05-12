import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('Radio – selection v3', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('radio/entry--v3'));
		await waitForReady(page);
	});

	test('can select a radio option', async ({page}) => {
		const container = page.locator('[data-testid="radio-v3-container"]');
		const options = container.locator('label.ts-radio__container');
		await options.nth(1).click();
		await expect(options.nth(1)).toHaveClass(/checked/);
	});

	test('initial selection is applied', async ({page}) => {
		const container = page.locator('[data-testid="radio-v3-container"]');
		const options = container.locator('label.ts-radio__container');
		await expect(options.first()).toHaveClass(/checked/);
	});
});
