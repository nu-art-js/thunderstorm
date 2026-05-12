import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('Toggle – toggle v3', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('toggle/entry--v3'));
		await waitForReady(page);
	});

	test('clicking toggles the state', async ({page}) => {
		const container = page.locator('[data-testid="toggle-v3-container"]');
		const input = container.locator('input.ts-toggle__checkbox');
		await expect(input).not.toBeChecked();
		await input.evaluate((el: HTMLInputElement) => el.click());
		await expect(input).toBeChecked();
	});
});
