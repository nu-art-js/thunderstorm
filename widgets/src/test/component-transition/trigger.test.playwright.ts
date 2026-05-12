import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('ComponentTransition – trigger v3 visible', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('component-transition/entry--v3-visible'));
		await waitForReady(page);
	});

	test('children are visible when triggered', async ({page}) => {
		const container = page.locator('[data-testid="component-transition-v3-container"]');
		await expect(container).toContainText('Transition v3');
	});
});

test.describe('ComponentTransition – trigger v3 hidden', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('component-transition/entry--v3-hidden'));
		await waitForReady(page);
	});

	test('children are not visible when not triggered', async ({page}) => {
		const span = page.locator('[data-testid="component-transition-v3-hidden-container"] span');
		await expect(span).not.toBeVisible();
	});
});
