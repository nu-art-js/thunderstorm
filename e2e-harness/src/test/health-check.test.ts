/*
 * @nu-art/e2e-harness - Abstract programmatic bootstrap for product E2E stacks
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {DEFAULT_POLL_INTERVAL_MS, DEFAULT_READY_TIMEOUT_MS, waitForHealthUrl} from '../main/health-check.js';

describe('E2E harness health-check', () => {
	it('waitForHealthUrl resolves when probe succeeds immediately', async () => {
		let calls = 0;
		await waitForHealthUrl(
			'https://example.test/',
			async () => {
				calls++;
				return true;
			},
			1_000,
			10,
		);
		expect(calls).to.equal(1);
	});

	it('waitForHealthUrl polls until probe succeeds', async () => {
		let calls = 0;
		await waitForHealthUrl(
			'https://example.test/',
			async () => {
				calls++;
				return calls >= 3;
			},
			1_000,
			5,
		);
		expect(calls).to.equal(3);
	});

	it('waitForHealthUrl throws after timeout', async () => {
		try {
			await waitForHealthUrl(
				'https://127.0.0.1:59999/',
				async () => false,
				50,
				10,
			);
			expect.fail('expected timeout error');
		} catch (error) {
			expect((error as Error).message).to.match(/did not become reachable/);
		}
	});

	it('exports stable default timing constants', () => {
		expect(DEFAULT_READY_TIMEOUT_MS).to.equal(120_000);
		expect(DEFAULT_POLL_INTERVAL_MS).to.equal(500);
	});
});
