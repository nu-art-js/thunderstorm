/*
 * @nu-art/db-api-frontend - runSerializedById tests run in browser (Playwright)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 *
 * Test content requires window/IDB; runs in Playwright, not Node.
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';

test.describe('runSerializedById', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => (window as any).DbApiFrontend !== undefined);
		await page.evaluate(() => (window as any).DbApiFrontend.cleanupDbApiIDB());
	});

	test('delete-wins: throws when upsert or patch run while delete is running or pending for same id', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi} = (window as any).DbApiFrontend;
			const api = new TestBaseApi();
			await api.init();
			const id = 'del-1';
			const deletePromise = api.runSerializedByIdExposed(id, 'delete', () => new Promise<void>((r) => setTimeout(r, 50)));
			let upsertRejected = false;
			let upsertMessage = '';
			try {
				await api.runSerializedByIdExposed(id, 'upsert', () => Promise.resolve(undefined));
			} catch (e: any) {
				upsertRejected = true;
				upsertMessage = e?.message ?? '';
			}
			let patchRejected = false;
			let patchMessage = '';
			try {
				await api.runSerializedByIdExposed(id, 'patch', () => Promise.resolve(undefined));
			} catch (e: any) {
				patchRejected = true;
				patchMessage = e?.message ?? '';
			}
			await deletePromise;
			return {upsertRejected, upsertMessage, patchRejected, patchMessage};
		});
		expect(result.upsertRejected).toBe(true);
		expect(result.upsertMessage).toMatch(/marked for deletion/);
		expect(result.patchRejected).toBe(true);
		expect(result.patchMessage).toMatch(/marked for deletion/);
	});

	test('no-id-skip-queue: runs immediately when id is undefined', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi} = (window as any).DbApiFrontend;
			const api = new TestBaseApi();
			await api.init();
			const order: number[] = [];
			const p = api.runSerializedByIdExposed(undefined, 'upsert', () => {
				order.push(1);
				return Promise.resolve(1);
			});
			order.push(0);
			const value = await p;
			return {value, order};
		});
		expect(result.value).toBe(1);
		// When id is undefined, fn runs immediately (no queue), so callback runs before next line: [1, 0]
		expect(result.order).toEqual([1, 0]);
	});

	test('no-id-skip-queue: runs immediately when id is empty string', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi} = (window as any).DbApiFrontend;
			const api = new TestBaseApi();
			await api.init();
			const value = await api.runSerializedByIdExposed('', 'upsert', () => Promise.resolve(2));
			return value;
		});
		expect(result).toBe(2);
	});

	test('queueing: second call for same id runs after first completes; order is deterministic', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi} = (window as any).DbApiFrontend;
			const api = new TestBaseApi();
			await api.init();
			const id = 'q-1';
			const order: number[] = [];
			const delay = (ms: number, n: number) => () =>
				new Promise<void>((res) => {
					setTimeout(() => {
						order.push(n);
						res();
					}, ms);
				});
			const first = api.runSerializedByIdExposed(id, 'upsert', delay(20, 1));
			const second = api.runSerializedByIdExposed(id, 'upsert', delay(5, 2));
			await Promise.all([first, second]);
			return order;
		});
		expect(result).toEqual([1, 2]);
	});

	test('only one pending: third call for same id while one running and one pending rejects', async ({page}) => {
		const result = await page.evaluate(async () => {
			const {TestBaseApi} = (window as any).DbApiFrontend;
			const api = new TestBaseApi();
			await api.init();
			const id = 'pending-1';
			let resolveOp1: () => void;
			const op1Promise = new Promise<void>((r) => { resolveOp1 = r; });
			const op1 = api.runSerializedByIdExposed(id, 'upsert', () => op1Promise);
			const op2 = api.runSerializedByIdExposed(id, 'upsert', () => Promise.resolve(undefined));
			let thirdRejected = false;
			let thirdMessage = '';
			try {
				await api.runSerializedByIdExposed(id, 'upsert', () => Promise.resolve(undefined));
			} catch (e: any) {
				thirdRejected = true;
				thirdMessage = e?.message ?? '';
			}
			resolveOp1!();
			await op1;
			await op2;
			return {thirdRejected, thirdMessage};
		});
		expect(result.thirdRejected).toBe(true);
		expect(result.thirdMessage).toMatch(/only one pending operation allowed/);
	});
});
