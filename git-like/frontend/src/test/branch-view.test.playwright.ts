/*
 * @nu-art/git-like-frontend - Branch view shows the composed delta
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';
import {resolve} from 'path';
import {fileURLToPath} from 'url';

const here = fileURLToPath(new URL('.', import.meta.url));
const shot = resolve(here, 'screenshots/branch-view.png');

test('branch view replaces, adds, and drops a tombstone', async ({page}) => {
	await page.goto('/src/test/index.html');
	await page.waitForFunction(() => window.TestReady === true);

	const view = page.locator('[data-testid="git-like-branch-view"]');
	await expect(view).toBeVisible();
	await expect(page.locator('[data-testid="row-doc-1"]')).toContainText('Edited on the branch');
	await expect(page.locator('[data-testid="row-doc-2"]')).toContainText('Added on the branch');
	await expect(page.locator('[data-testid="row-doc-3"]')).toHaveCount(0);

	const ids = await page.evaluate(() => window.GitLikeRows.map(row => row._id).sort());
	expect(ids).toEqual(['doc-1', 'doc-2']);

	await view.screenshot({path: shot});
});
