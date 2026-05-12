/*
 * PropRenderer – error and disabled state tests.
 */
import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('PropRenderer – error state', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('prop-renderer/entry--error'));
		await waitForReady(page);
	});

	test('error message is rendered', async ({page}) => {
		const container = page.locator('[data-testid="prop-renderer-error-container"]');
		await expect(container.getByText('Error message')).toBeVisible();
		await expect(container.locator('.ts-prop-renderer__error')).toBeVisible();
	});
});

test.describe('PropRenderer – disabled state', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('prop-renderer/entry--disabled'));
		await waitForReady(page);
	});

	test('disabled state has disabled class', async ({page}) => {
		const container = page.locator('[data-testid="prop-renderer-disabled-container"]');
		await expect(container.locator('.ts-prop-renderer.disabled')).toBeVisible();
	});
});
