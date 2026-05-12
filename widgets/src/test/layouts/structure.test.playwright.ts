/*
 * Layouts – structure and children tests (v3).
 */
import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('Layouts – structure – v3', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('layouts/entry--v3'));
		await waitForReady(page);
	});

	test('children are in correct DOM order', async ({page}) => {
		const container = page.locator('[data-testid="layouts-v3-container"]');
		await expect(container).toBeVisible();
		const spans = container.locator('span');
		await expect(spans.nth(0)).toHaveText('A');
		await expect(spans.nth(1)).toHaveText('B');
	});

	test('layout has expected class', async ({page}) => {
		const container = page.locator('[data-testid="layouts-v3-container"]');
		await expect(container.locator('.ll_v_l')).toBeVisible();
		await expect(container.locator('.layouts-v3-demo')).toBeVisible();
	});
});
