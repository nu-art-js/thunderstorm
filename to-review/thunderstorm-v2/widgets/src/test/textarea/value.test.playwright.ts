/*
 * TextArea – value tests (v1, v2).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

const VERSIONS = ['v1', 'v2'] as const;

test.describe('TextArea – value', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	for (const version of VERSIONS) {
		test(`${version}: can type and value is reflected`, async ({page}) => {
			const textarea = page.locator(`#textarea-${version}`);
			await textarea.fill('hello');
			await expect(textarea).toHaveValue('hello');
		});

		test(`${version}: retains value after blur`, async ({page}) => {
			const textarea = page.locator(`#textarea-${version}`);
			await textarea.fill('blur-test');
			await textarea.blur();
			await expect(textarea).toHaveValue('blur-test');
		});
	}
});
