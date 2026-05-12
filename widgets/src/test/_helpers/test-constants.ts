export const testPage = (entry: string) => `/src/test/index.html?entry=${entry}`;

export async function waitForReady(page: { waitForFunction: (fn: () => boolean) => Promise<unknown> }): Promise<void> {
	await page.waitForFunction(() => (window as unknown as { TestReady?: boolean }).TestReady === true);
}
