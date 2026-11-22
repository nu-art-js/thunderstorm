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

test('dev tools lists registered actions, keeps the last selection, and follows the theme', async ({page}) => {
	mkdirSync(dist, {recursive: true});
	await page.setViewportSize({width: 1280, height: 900});
	await page.goto('/src/test/dev-tools/index.html');
	await page.waitForFunction(() => (window as unknown as {TestReady?: boolean}).TestReady === true);
	const actions = page.getByRole('region', {name: 'Actions'});
	await expect(page.getByRole('heading', {name: 'Refactoring Actions'})).toBeVisible();
	await expect(actions.getByRole('button', {name: /Setup project/})).toBeVisible();
	await expect(actions.getByRole('button', {name: /Knowledge access restamp/})).toBeVisible();
	await expect(page.getByLabel('Paste or type Setup project to confirm')).toBeVisible();
	await expect(page.getByRole('button', {name: 'Run'})).toBeDisabled();
	await page.screenshot({path: resolve(dist, '00-dev-tools-light.png'), fullPage: true});

	await actions.getByRole('button', {name: /Knowledge access restamp/}).click();
	await expect(page.getByLabel('Paste or type Knowledge access restamp to confirm')).toBeVisible();
	await expect(actions.getByRole('button', {name: /Knowledge access restamp/})).toHaveAttribute('aria-current', 'true');
	await page.screenshot({path: resolve(dist, '01-dev-tools-selected.png'), fullPage: true});

	await page.reload();
	await page.waitForFunction(() => (window as unknown as {TestReady?: boolean}).TestReady === true);
	const actionsAfterRefresh = page.getByRole('region', {name: 'Actions'});
	await expect(page.getByLabel('Paste or type Knowledge access restamp to confirm')).toBeVisible();
	await expect(actionsAfterRefresh.getByRole('button', {name: /Knowledge access restamp/})).toHaveAttribute('aria-current', 'true');
	await page.screenshot({path: resolve(dist, '02-dev-tools-selection-kept.png'), fullPage: true});

	await page.getByLabel('Paste or type Knowledge access restamp to confirm').fill('Knowledge access restamp');
	await expect(page.getByRole('button', {name: 'Run'})).toBeEnabled();
	await page.screenshot({path: resolve(dist, '03-dev-tools-confirm-typed.png'), fullPage: true});

	await page.getByRole('button', {name: 'Run'}).click();
	const log = page.getByRole('region', {name: 'Run log'});
	await expect(log.getByText('OK')).toBeVisible();
	await expect(log.getByText('Knowledge access restamp')).toBeVisible();
	await expect(page.getByText(/Today \d{2}:\d{2}:\d{2}/)).toBeVisible();
	await page.screenshot({path: resolve(dist, '04-dev-tools-run-log.png'), fullPage: true});

	await page.evaluate(() => {
		document.documentElement.dataset.theme = 'dark';
	});
	await page.screenshot({path: resolve(dist, '05-dev-tools-dark.png'), fullPage: true});

	await page.goto('/src/test/dev-tools-empty/index.html');
	await page.waitForFunction(() => (window as unknown as {TestReady?: boolean}).TestReady === true);
	await expect(page.getByRole('region', {name: 'Actions'}).getByText('No actions are registered.')).toBeVisible();
	await expect(page.getByText('The catalog is empty.')).toBeVisible();
	await page.screenshot({path: resolve(dist, '06-dev-tools-empty.png'), fullPage: true});
});
