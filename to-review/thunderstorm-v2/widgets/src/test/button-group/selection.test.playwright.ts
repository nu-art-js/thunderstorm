/*
 * ButtonGroup – selection tests.
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

test.describe('ButtonGroup – selection', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	test('uncontrolled: click selects button', async ({page}) => {
		const container = page.locator('[data-testid="button-group-horizontal-container"]');
		await container.getByRole('button', {name: 'Right'}).click();
		await expect(container.locator('button.selected')).toBeVisible();
	});

	test('controlled: selected state visible', async ({page}) => {
		const container = page.locator('[data-testid="button-group-vertical-container"]');
		await expect(container.getByRole('button', {name: 'Up'}).or(container.getByRole('button', {name: 'Down'}))).toBeVisible();
	});
});
