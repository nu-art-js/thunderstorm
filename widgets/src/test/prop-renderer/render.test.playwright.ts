import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

test.describe('PropRenderer – render – Vertical', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('prop-renderer/entry--vertical'));
		await waitForReady(page);
	});

	test('container is visible', async ({page}) => {
		const container = page.locator('[data-testid="prop-renderer-vertical-container"]');
		await expect(container).toBeVisible();
	});
});

test.describe('PropRenderer – render – Horizontal', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('prop-renderer/entry--horizontal'));
		await waitForReady(page);
	});

	test('container is visible', async ({page}) => {
		const container = page.locator('[data-testid="prop-renderer-horizontal-container"]');
		await expect(container).toBeVisible();
	});
});

test.describe('PropRenderer – render – Flat', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('prop-renderer/entry--flat'));
		await waitForReady(page);
	});

	test('container is visible', async ({page}) => {
		const container = page.locator('[data-testid="prop-renderer-flat-container"]');
		await expect(container).toBeVisible();
	});
});

test.describe('PropRenderer – render – Error', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('prop-renderer/entry--error'));
		await waitForReady(page);
	});

	test('container is visible', async ({page}) => {
		const container = page.locator('[data-testid="prop-renderer-error-container"]');
		await expect(container).toBeVisible();
	});
});

test.describe('PropRenderer – render – Disabled', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('prop-renderer/entry--disabled'));
		await waitForReady(page);
	});

	test('container is visible', async ({page}) => {
		const container = page.locator('[data-testid="prop-renderer-disabled-container"]');
		await expect(container).toBeVisible();
	});
});
