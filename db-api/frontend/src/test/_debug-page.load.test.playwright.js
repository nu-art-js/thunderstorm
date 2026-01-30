/*
 * Temporary: load test page and capture console/errors to debug why window.DbApiFrontend is undefined.
 */
import { expect, test } from '@playwright/test';
const testPagePath = '/src/test/index.html';
test('debug: load page and capture errors', async ({ page }) => {
    const logs = [];
    const errors = [];
    // Capture window.onerror (message, source, lineno, colno) so we get failing script URL
    await page.addInitScript(() => {
        window.__capturedErrors = [];
        window.onerror = (msg, source, lineno, colno) => {
            window.__capturedErrors.push({ msg, source, lineno, colno });
            return false;
        };
    });
    page.on('console', (msg) => {
        const text = msg.text();
        logs.push(`[${msg.type()}] ${text}`);
        if (msg.type() === 'error') {
            // eslint-disable-next-line no-console
            console.error('Console error:', text);
        }
    });
    page.on('pageerror', (e) => {
        const errorMsg = `PAGE ERROR: ${e.message}\nStack: ${e.stack ?? 'no stack'}\nName: ${e.name}`;
        errors.push(errorMsg);
        // eslint-disable-next-line no-console
        console.error('Page error:', errorMsg);
    });
    await page.goto(testPagePath, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    const hasDbApi = await page.evaluate(() => window.DbApiFrontend !== undefined);
    const captured = await page.evaluate(() => window.__capturedErrors ?? []);
    const consoleOut = logs.join('\n');
    const errOut = errors.join('\n\n');
    // eslint-disable-next-line no-console
    console.log('window.DbApiFrontend defined:', hasDbApi);
    if (captured.length > 0)
        // eslint-disable-next-line no-console
        console.log('Captured onerror:', JSON.stringify(captured, null, 2));
    // eslint-disable-next-line no-console
    console.log('Console logs:', consoleOut || '(none)');
    // eslint-disable-next-line no-console
    console.log('Page errors:', errOut || '(none)');
    expect(hasDbApi, `DbApiFrontend undefined. onerror: ${JSON.stringify(captured)}. Errors: ${errOut}`).toBe(true);
});
//# sourceMappingURL=_debug-page.load.test.playwright.js.map