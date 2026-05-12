/*
 * Layouts – simple render tests (v3).
 */
import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('Layouts – render – v3', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('layouts/entry--v3'));
		await waitForReady(page);
	});

	test('container and children A, B are visible', async ({page}) => {
		const container = page.locator('[data-testid="layouts-v3-container"]');
		await expect(container).toBeVisible();
		await expect(container.getByText('A')).toBeVisible();
		await expect(container.getByText('B')).toBeVisible();
	});
});
