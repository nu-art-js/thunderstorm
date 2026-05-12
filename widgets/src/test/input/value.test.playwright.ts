/*
 * Input – value and interaction tests (v3).
 */
import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('Input – value – v3', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('input/entry--v3'));
		await waitForReady(page);
	});

	test('can type and value is reflected', async ({page}) => {
		const input = page.locator('#input-v3');
		await input.fill('hello');
		await expect(input).toHaveValue('hello');
	});

	test('retains value after blur', async ({page}) => {
		const input = page.locator('#input-v3');
		await input.fill('blur-test');
		await input.blur();
		await expect(input).toHaveValue('blur-test');
	});
});
