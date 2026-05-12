import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('MemoryMonitor – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('memory-monitor/entry--v1'));
		await waitForReady(page);
	});

	test('version label is rendered', async ({page}) => {
		const label = page.locator('.ts-memory-monitor__version');
		await expect(label).toBeVisible();
		await expect(label).toHaveText('test-env-1.0.0');
	});
});
