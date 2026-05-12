/*
 * Link – href, target, children tests (v3).
 */
import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('Link – href – v3', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('link/entry--v3'));
		await waitForReady(page);
	});

	test('children text is rendered', async ({page}) => {
		const container = page.locator('[data-testid="link-v3-container"]');
		await expect(container).toBeVisible();
		await expect(container.getByText('Link v3')).toBeVisible();
	});

	test('has ts-link class', async ({page}) => {
		const container = page.locator('[data-testid="link-v3-container"]');
		await expect(container.locator('.ts-link')).toBeVisible();
	});

	test('link is clickable', async ({page}) => {
		const container = page.locator('[data-testid="link-v3-container"]');
		const link = container.locator('.ts-link');
		await expect(link).toBeVisible();
		await link.click();
		await expect(page).toHaveURL(/\/test/);
	});
});
