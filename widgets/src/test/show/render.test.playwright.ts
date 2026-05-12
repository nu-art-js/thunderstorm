import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('Show – render – if true', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('show/entry--if-true'));
		await waitForReady(page);
	});

	test('container is visible', async ({page}) => {
		const container = page.locator('[data-testid="show-if-true-container"]');
		await expect(container).toBeVisible();
	});
});

test.describe('Show – render – if false', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('show/entry--if-false'));
		await waitForReady(page);
	});

	test('container is visible', async ({page}) => {
		const container = page.locator('[data-testid="show-if-false-container"]');
		await expect(container).toBeVisible();
	});
});
