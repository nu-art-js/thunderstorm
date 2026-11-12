/*
 * TextArea – wrap boolean (v2).
 */
import {expect, test} from '@playwright/test';
import {testPage, waitForReady} from '../_helpers/test-constants.js';

const longLine = 'Read this when the line is longer than the field. '.repeat(6);

test.describe('TextArea – wrap – v2', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPage('textarea/entry--v2'));
		await waitForReady(page);
	});

	test('wrap overrides host nowrap', async ({page}) => {
		const plain = page.locator('#textarea-v2');
		const wrapped = page.locator('#textarea-v2-wrap');
		await expect(plain).toHaveCSS('white-space', 'nowrap');
		await expect(wrapped).toHaveCSS('white-space', 'pre-wrap');
		await wrapped.fill(longLine);
		const overflow = await wrapped.evaluate(node => (node as HTMLTextAreaElement).scrollWidth - node.clientWidth);
		expect(overflow).toBeLessThanOrEqual(2);
	});
});
