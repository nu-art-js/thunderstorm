/*
 * Input – value and interaction tests (v1, v2, v3).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

const VERSIONS = ['v1', 'v2', 'v3'] as const;

test.describe('Input – value', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	for (const version of VERSIONS) {
		test(`${version}: can type and value is reflected`, async ({page}) => {
			const input = page.locator(`#input-${version}`);
			await input.fill('hello');
			await expect(input).toHaveValue('hello');
		});

		test(`${version}: retains value after blur`, async ({page}) => {
			const input = page.locator(`#input-${version}`);
			await input.fill('blur-test');
			await input.blur();
			await expect(input).toHaveValue('blur-test');
		});
	}
});
