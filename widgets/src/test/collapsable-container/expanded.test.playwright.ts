import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('CollapsableContainer – expanded v3', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('collapsable-container/entry--v3'));
		await waitForReady(page);
	});

	test('content is visible when initially expanded', async ({page}) => {
		const container = page.locator('[data-testid="collapsable-v3-container"]');
		await expect(container).toContainText('Content v3');
	});

	test('header is visible', async ({page}) => {
		const container = page.locator('[data-testid="collapsable-v3-container"]');
		await expect(container).toContainText('Header v3');
	});
});
