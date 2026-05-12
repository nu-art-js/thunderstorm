/*
 * ButtonGroup – selection tests.
 */
import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('ButtonGroup – selection', () => {
	test('uncontrolled: click selects button', async ({page}) => {
		await page.goto(testPage('button-group/entry--horizontal'));
		await waitForReady(page);
		const container = page.locator('[data-testid="button-group-horizontal-container"]');
		await container.getByRole('button', {name: 'Right'}).click();
		await expect(container.locator('button.selected')).toBeVisible();
	});

	test('controlled: selected state visible', async ({page}) => {
		await page.goto(testPage('button-group/entry--vertical'));
		await waitForReady(page);
		const container = page.locator('[data-testid="button-group-vertical-container"]');
		await container.getByRole('button', {name: 'Up'}).click();
		await expect(container.locator('button.selected')).toBeVisible();
	});
});
