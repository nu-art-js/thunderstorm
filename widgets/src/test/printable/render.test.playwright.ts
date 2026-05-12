/*
 * Printable – simple render tests (v3).
 */
import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('Printable – render – v3', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('printable/entry--v3'));
		await waitForReady(page);
	});

	test('container and text are visible', async ({page}) => {
		const container = page.locator('[data-testid="printable-v3-container"]');
		await expect(container).toBeVisible();
		await expect(container.getByText('Printable v3')).toBeVisible();
	});

	test('has ts-printable root', async ({page}) => {
		const container = page.locator('[data-testid="printable-v3-container"]');
		await expect(container.locator('.ts-printable')).toBeVisible();
	});
});
