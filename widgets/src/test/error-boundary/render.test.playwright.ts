import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('ErrorBoundary – render – ok', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('error-boundary/entry--ok'));
		await waitForReady(page);
	});

	test('container is visible', async ({page}) => {
		const container = page.locator('[data-testid="error-boundary-ok-container"]');
		await expect(container).toBeVisible();
	});
});

test.describe('ErrorBoundary – render – catch', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('error-boundary/entry--catch'));
		await waitForReady(page);
	});

	test('container is visible', async ({page}) => {
		const container = page.locator('[data-testid="error-boundary-catch-container"]');
		await expect(container).toBeVisible();
	});
});
