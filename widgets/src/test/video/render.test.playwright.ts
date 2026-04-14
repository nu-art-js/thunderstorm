/*
 * Video – render tests.
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('Video – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('video element is present', async ({page}) => {
		const container = page.locator('[data-testid="video-container"]');
		await expect(container).toBeVisible();
		const video = container.locator('video');
		await expect(video).toBeVisible();
	});

	test('source format is set', async ({page}) => {
		const container = page.locator('[data-testid="video-container"]');
		const source = container.locator('source[type="video/mp4"]');
		await expect(source).toBeVisible();
	});

	test('unsupported message as fallback text', async ({page}) => {
		const container = page.locator('[data-testid="video-container"]');
		await expect(container.getByText('Video not supported')).toBeVisible();
	});
});
