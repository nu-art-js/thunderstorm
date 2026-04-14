/*
 * TextArea – render tests (v1, v2).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

const VERSIONS = ['v1', 'v2'] as const;

test.describe('TextArea – render', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	for (const version of VERSIONS) {
		test(`${version}: container and textarea are visible`, async ({page}) => {
			const container = page.locator(`[data-testid="textarea-${version}-container"]`);
			await expect(container).toBeVisible();
			const textarea = page.locator(`#textarea-${version}`);
			await expect(textarea).toBeVisible();
		});

		test(`${version}: placeholder is shown`, async ({page}) => {
			const textarea = page.locator(`#textarea-${version}`);
			await expect(textarea).toHaveAttribute('placeholder', `${version} placeholder`);
		});
	}
});
