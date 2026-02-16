/*
 * MemoryMonitor – render tests.
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('MemoryMonitor – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('memory monitor container and label visible', async ({page}) => {
		const container = page.locator('[data-testid="memory-monitor-container"]');
		await expect(container).toBeVisible();
		await expect(container.locator('.ts-memory-monitor')).toBeVisible();
		await expect(container.getByText('test-env-1.0.0')).toBeVisible();
	});
});
