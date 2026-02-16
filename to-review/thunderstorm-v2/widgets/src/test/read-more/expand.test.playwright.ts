/*
 * ReadMore – expand/collapse tests (v1, v3).
 */
import {expect, test} from '@playwright/test';
import {TEST_PAGE_PATH, waitForAppReady} from '../_helpers/test-constants.js';

const VERSIONS = ['v1', 'v3'] as const;

test.describe('ReadMore – expand', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(TEST_PAGE_PATH);
		await waitForAppReady(page);
	});

	for (const version of VERSIONS) {
		test(`${version}: read more link is visible when text is long`, async ({page}) => {
			const container = page.locator(`[data-testid="read-more-${version}-container"]`);
			await expect(container).toBeVisible();
			await expect(container.getByText('Read More')).toBeVisible();
		});

		test(`${version}: click Read More expands content`, async ({page}) => {
			const container = page.locator(`[data-testid="read-more-${version}-container"]`);
			await container.getByText('Read More').click();
			await expect(container.getByText('Read Less')).toBeVisible();
		});

		test(`${version}: click Read Less collapses content`, async ({page}) => {
			const container = page.locator(`[data-testid="read-more-${version}-container"]`);
			await container.getByText('Read More').click();
			await expect(container.getByText('Read Less')).toBeVisible();
			await container.getByText('Read Less').click();
			await expect(container.getByText('Read More')).toBeVisible();
		});
	}
});
