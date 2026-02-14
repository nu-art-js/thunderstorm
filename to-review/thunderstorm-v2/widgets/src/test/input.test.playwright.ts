/*
 * Thunder Widgets – Playwright tests for Input (v1, v2, v3).
 * Same scenarios run against all three versions for consistency.
 */
import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';

const INPUT_VERSIONS = ['v1', 'v2', 'v3'] as const;

test.describe('Input – same scenarios for all versions', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => (window as unknown as { WidgetsTestReady?: boolean }).WidgetsTestReady === true);
	});

	for (const version of INPUT_VERSIONS) {
		test(`${version}: renders and can type`, async ({page}) => {
			const container = page.locator(`[data-testid="input-${version}-container"]`);
			await expect(container).toBeVisible();

			const input = page.locator(`#input-${version}`);
			await expect(input).toBeVisible();
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
