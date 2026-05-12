import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('ComponentTransition – render v3 visible', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('component-transition/entry--v3-visible'));
		await waitForReady(page);
	});

	test('container is visible', async ({page}) => {
		const container = page.locator('[data-testid="component-transition-v3-container"]');
		await expect(container).toBeVisible();
	});
});

test.describe('ComponentTransition – render v3 hidden', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('component-transition/entry--v3-hidden'));
		await waitForReady(page);
	});

	test('container is present', async ({page}) => {
		const container = page.locator('[data-testid="component-transition-v3-hidden-container"]');
		await expect(container).toBeAttached();
	});
});
