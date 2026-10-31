/*
 * @nu-art/git-like-frontend - Delta API paints the cache and a branch switch replaces it
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';
import {resolve} from 'path';
import {fileURLToPath} from 'url';

const here = fileURLToPath(new URL('.', import.meta.url));
const pageShot = resolve(here, 'screenshots/delta-cache-page.png');
const contextShot = resolve(here, 'screenshots/delta-cache-context.png');

test('delta API replace reaches the cache and the next branch replaces it', async ({page}) => {
	await page.goto('/src/test/cache.html');
	await page.waitForFunction(() => window.TestReady === true);

	await expect(page.locator('[data-testid="row-doc-1"]')).toContainText('Edited on the branch');
	await expect(page.locator('[data-testid="row-doc-secret"]')).toHaveCount(0);

	const first = await page.evaluate(() => window.GitLikeRows.map(row => row.label));
	expect(first).toEqual(['Edited on the branch']);

	await page.evaluate(async () => window.SwitchBranch());
	await expect(page.locator('[data-testid="row-doc-1"]')).toContainText('Other branch');
	await expect(page.locator('[data-testid="row-doc-secret"]')).toHaveCount(0);

	const second = await page.evaluate(() => window.GitLikeRows.map(row => ({id: row._id, label: row.label})));
	expect(second).toEqual([{id: 'doc-1', label: 'Other branch'}]);

	await page.screenshot({path: pageShot, fullPage: true});
	await page.screenshot({path: contextShot});
});
