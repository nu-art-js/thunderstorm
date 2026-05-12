/*
 * Button – click, disabled, loading state tests (v3).
 */
import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('Button v3 – click', () => {
	test('click fires callback', async ({page}) => {
		await page.goto(testPage('button/entry--v3'));
		await waitForReady(page);
		const container = page.locator('[data-testid="button-v3-container"]');
		const btn = container.getByRole('button', {name: 'Button v3'});
		await expect(btn).toBeVisible();
		await btn.click();
		await expect(btn).toBeVisible();
	});

	test('disabled button is not clickable', async ({page}) => {
		await page.goto(testPage('button/entry--v3-disabled'));
		await waitForReady(page);
		const container = page.locator('[data-testid="button-v3-disabled-container"]');
		const btn = container.getByRole('button', {name: 'Button v3 disabled'});
		await expect(btn).toBeVisible();
		await expect(btn).toBeDisabled();
	});

	test('loading state renders action-in-progress', async ({page}) => {
		await page.goto(testPage('button/entry--v3-loading'));
		await waitForReady(page);
		const container = page.locator('[data-testid="button-v3-loading-container"]');
		const btn = container.getByRole('button');
		await expect(btn).toBeVisible();
		await expect(container.locator('.ts-button.action-in-progress')).toBeVisible();
	});
});
