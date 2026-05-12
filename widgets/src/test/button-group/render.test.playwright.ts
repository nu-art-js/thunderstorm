/*
 * ButtonGroup – render tests.
 */
import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('ButtonGroup – render', () => {
	test('horizontal buttons visible', async ({page}) => {
		await page.goto(testPage('button-group/entry--horizontal'));
		await waitForReady(page);
		const container = page.locator('[data-testid="button-group-horizontal-container"]');
		await expect(container).toBeVisible();
		await expect(container.getByRole('button', {name: 'Left'})).toBeVisible();
		await expect(container.getByRole('button', {name: 'Right'})).toBeVisible();
	});

	test('vertical buttons visible', async ({page}) => {
		await page.goto(testPage('button-group/entry--vertical'));
		await waitForReady(page);
		const container = page.locator('[data-testid="button-group-vertical-container"]');
		await expect(container).toBeVisible();
		await expect(container.getByRole('button', {name: 'Up'})).toBeVisible();
		await expect(container.getByRole('button', {name: 'Down'})).toBeVisible();
	});
});
