/*
 * @nu-art/action-processor-frontend - Dev Tools screen
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {expect, test} from '@playwright/test';

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../../../dist-test');

test('dev tools lists registered actions, confirms a run, and follows the theme', async ({page}) => {
	mkdirSync(dist, {recursive: true});
	await page.setViewportSize({width: 1280, height: 900});
	await page.goto('/src/test/dev-tools/index.html');
	await page.waitForFunction(() => (window as unknown as {TestReady?: boolean}).TestReady === true);
	await expect(page.getByRole('heading', {name: 'Refactoring Actions'})).toBeVisible();
	await expect(page.getByRole('button', {name: /Setup project/})).toBeVisible();
	await expect(page.getByRole('button', {name: /Knowledge access restamp/})).toBeVisible();
	await expect(page.getByLabel('Type Setup project to confirm')).toBeVisible();
	await expect(page.getByRole('button', {name: 'Run'})).toBeDisabled();
	await page.screenshot({path: resolve(dist, '00-dev-tools-light.png'), fullPage: true});

	await page.getByLabel('Type Setup project to confirm').fill('Setup project');
	await expect(page.getByRole('button', {name: 'Run'})).toBeEnabled();
	await page.screenshot({path: resolve(dist, '01-dev-tools-confirm-typed.png'), fullPage: true});

	await page.getByRole('button', {name: 'Run'}).click();
	await expect(page.getByText('Setup project completed.')).toBeVisible();
	await expect(page.getByText(/Executed at/)).toBeVisible();
	await page.screenshot({path: resolve(dist, '02-dev-tools-run-log.png'), fullPage: true});

	await page.evaluate(() => {
		document.documentElement.dataset.theme = 'dark';
	});
	await page.screenshot({path: resolve(dist, '03-dev-tools-dark.png'), fullPage: true});

	await page.goto('/src/test/dev-tools-empty/index.html');
	await page.waitForFunction(() => (window as unknown as {TestReady?: boolean}).TestReady === true);
	await expect(page.getByRole('region', {name: 'Actions'}).getByText('No actions are registered.')).toBeVisible();
	await expect(page.getByText('The catalog is empty.')).toBeVisible();
	await page.screenshot({path: resolve(dist, '04-dev-tools-empty.png'), fullPage: true});
});
