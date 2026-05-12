/*
 * TextArea – value tests (v2).
 */
import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('TextArea – value – v2', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('textarea/entry--v2'));
		await waitForReady(page);
	});

	test('can type and value is reflected', async ({page}) => {
		const textarea = page.locator('#textarea-v2');
		await textarea.fill('hello');
		await expect(textarea).toHaveValue('hello');
	});

	test('retains value after blur', async ({page}) => {
		const textarea = page.locator('#textarea-v2');
		await textarea.fill('blur-test');
		await textarea.blur();
		await expect(textarea).toHaveValue('blur-test');
	});
});
