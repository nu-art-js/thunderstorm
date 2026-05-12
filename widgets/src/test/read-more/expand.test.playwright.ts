import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('ReadMore – expand v3', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('read-more/entry--v3'));
		await waitForReady(page);
	});

	test('text content is present', async ({page}) => {
		const container = page.locator('[data-testid="read-more-v3-container"]');
		await expect(container).toContainText('This is a long paragraph');
	});
});
