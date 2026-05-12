/*
 * CheckboxGroup – content tests (v3).
 */
import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('CheckboxGroup v3 – content', () => {
	test('shows parent label and option labels A, B', async ({page}) => {
		await page.goto(testPage('checkbox-group/entry--v3'));
		await waitForReady(page);
		const container = page.locator('[data-testid="checkbox-group-v3-container"]');
		await expect(container.locator('.ts-checkbox__content', {hasText: 'Parent v3'})).toBeVisible();
		const children = container.locator('.ts-checkbox-group__children .ts-checkbox__content');
		await expect(children.nth(0)).toHaveText('A');
		await expect(children.nth(1)).toHaveText('B');
	});
});
