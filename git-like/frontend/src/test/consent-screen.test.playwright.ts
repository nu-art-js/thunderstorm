/*
 * @nu-art/git-like-frontend - Merge consent screen shows the delta
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';
import {resolve} from 'path';
import {fileURLToPath} from 'url';

const here = fileURLToPath(new URL('.', import.meta.url));
const shot = resolve(here, 'screenshots/consent-screen.png');

test('consent screen shows replace and add, and leaves the tombstone off live', async ({page}) => {
	await page.goto('/src/test/consent.html');
	await page.waitForFunction(() => window.TestReady === true);

	const screen = page.locator('[data-testid="git-like-consent-screen"]');
	await expect(screen).toBeVisible();
	await expect(screen).toContainText('design');
	await expect(page.locator('[data-testid="change-doc-1"]')).toContainText('replace');
	await expect(page.locator('[data-testid="change-doc-2"]')).toContainText('add');
	await expect(page.locator('[data-testid="change-doc-3"]')).toContainText('tombstone');
	await expect(page.locator('[data-testid="after-doc-1"]')).toContainText('Edited on the branch');
	await expect(page.locator('[data-testid="after-doc-2"]')).toContainText('Added on the branch');
	await expect(page.locator('[data-testid="after-doc-3"]')).toHaveCount(0);

	const words = await page.evaluate(() => window.ConsentContent);
	expect(words).toContain('doc-1 replace');
	expect(words).toContain('doc-2 add');
	expect(words).toContain('doc-3 tombstone');
	expect(words).not.toContain('<');

	await page.locator('[data-testid="button-merge"]').click();
	await expect.poll(() => page.evaluate(() => window.ConsentPressed)).toBe('merge');

	await screen.screenshot({path: shot});
});
