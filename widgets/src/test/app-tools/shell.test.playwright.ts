import {mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {expect, test, type Page} from '@playwright/test';
import {testPage} from '../_helpers/test-constants.js';

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../ui-modules/dist-test');

test('dev tools lists screens and renders the selected screen', async ({page}) => {
	mkdirSync(dist, {recursive: true});
	await page.setViewportSize({width: 1280, height: 900});
	await page.goto(testPage('app-tools/entry--shell'));
	await expect(page.getByText('Dev Tools', {exact: true})).toBeVisible();
	await expect(page.getByLabel('Search tools')).toBeVisible();
	await expect(page.getByRole('button', {name: 'All', exact: true})).toBeVisible();
	await expect(page.getByRole('button', {name: 'Recent', exact: true})).toBeVisible();
	await expect(page.getByLabel('Group by')).toBeVisible();
	for (const name of ['Button', 'Checkbox V2', 'Collection Upgrades', 'Crud Operations', 'Accounts Editor', 'SessionData', 'Refactoring Actions'])
		await expect(page.getByRole('link', {name, exact: true})).toBeVisible();
	await page.screenshot({path: resolve(dist, '00-screen-list.png'), fullPage: true});

	await page.getByLabel('Search tools').fill('Refactoring');
	await expect(page.getByRole('link', {name: 'Refactoring Actions', exact: true})).toBeVisible();
	await expect(page.getByRole('link', {name: 'Button', exact: true})).toHaveCount(0);
	await page.screenshot({path: resolve(dist, '01-search.png'), fullPage: true});

	await page.getByLabel('Search tools').fill('');
	const buttonRow = page.locator('.ts-app-tools__registry__row').filter({has: page.getByRole('link', {name: 'Button', exact: true})});
	await buttonRow.getByRole('button', {name: 'Pin Button', exact: true}).click();
	await expect(page.getByRole('button', {name: 'Unpin Button', exact: true})).toHaveCount(2);
	await expect(page.getByRole('link', {name: 'Button', exact: true})).toHaveCount(2);
	await page.screenshot({path: resolve(dist, '02-pinned.png'), fullPage: true});

	await openScreen(page, 'Refactoring Actions');
	await expect(page.getByRole('heading', {name: 'Refactoring Actions'})).toBeVisible();
	await expect(page.getByRole('button', {name: 'Pin', exact: true})).toBeVisible();
	await expect(page.getByRole('button', {name: 'Copy link', exact: true})).toBeVisible();
	await page.screenshot({path: resolve(dist, '03-refactoring-actions.png'), fullPage: true});
});

async function openScreen(page: Page, name: string) {
	const href = await page.getByRole('link', {name, exact: true}).getAttribute('href');
	await page.evaluate((path: string) => {
		history.pushState({}, '', path);
		window.dispatchEvent(new PopStateEvent('popstate'));
	}, href);
}
