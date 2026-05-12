/*
 * Input – simple render tests (v3).
 */
import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('Input – render – v3', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('input/entry--v3'));
		await waitForReady(page);
	});

	test('container and input are visible', async ({page}) => {
		const container = page.locator('[data-testid="input-v3-container"]');
		await expect(container).toBeVisible();
		const input = page.locator('#input-v3');
		await expect(input).toBeVisible();
	});
});
