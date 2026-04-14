/**
 * Shared constants and helpers for Playwright tests.
 * Each component test folder imports from here for consistency.
 */
export const TEST_PAGE_PATH = '/src/test/index.html';

export async function waitForAppReady(page: { waitForFunction: (fn: () => boolean) => Promise<unknown> }): Promise<void> {
	await page.waitForFunction(() => (window as unknown as { WidgetsTestReady?: boolean }).WidgetsTestReady === true);
}
