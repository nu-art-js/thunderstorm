/*
 * TextArea – render tests (v2).
 */
import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('TextArea – render – v2', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('textarea/entry--v2'));
		await waitForReady(page);
	});

	test('container and textarea are visible', async ({page}) => {
		const container = page.locator('[data-testid="textarea-v2-container"]');
		await expect(container).toBeVisible();
		const textarea = page.locator('#textarea-v2');
		await expect(textarea).toBeVisible();
	});

	test('placeholder is shown', async ({page}) => {
		const textarea = page.locator('#textarea-v2');
		await expect(textarea).toHaveAttribute('placeholder', 'v2 placeholder');
	});
});
