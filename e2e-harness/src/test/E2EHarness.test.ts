/*
 * @nu-art/e2e-harness - Abstract programmatic bootstrap for product E2E stacks
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {E2EHarness} from '../main/E2EHarness.js';
import type {E2EHarnessConfig} from '../main/types.js';

describe('E2EHarness', () => {
	const baseConfig: E2EHarnessConfig = {
		backendPackage: '@app/backend',
		healthUrl: 'https://127.0.0.1:8102/',
	};

	afterEach(async () => {
		await E2EHarness.teardownActive();
	});

	it('reuses an already reachable stack without calling startStack', async () => {
		let startCalls = 0;
		const handle = await E2EHarness.ensure({
			...baseConfig,
			startup: {
				startStack: async () => {
					startCalls++;
				},
			},
		}, async () => true);

		expect(handle.reusedExisting).to.be.true;
		expect(startCalls).to.equal(0);
	});

	it('throws when stack is unreachable and startStack is missing', async () => {
		try {
			await E2EHarness.ensure(baseConfig, async () => false);
			expect.fail('expected bootstrap error');
		} catch (error) {
			expect((error as Error).message).to.match(/not implemented yet/);
			expect((error as Error).message).to.match(/no manual pre-launch/);
		}
	});

	it('starts stack and waits for health when bootstrap hook is provided', async () => {
		let started = false;
		let probeCalls = 0;
		const handle = await E2EHarness.ensure({
			...baseConfig,
			readyTimeoutMs: 1_000,
			pollIntervalMs: 5,
			startup: {
				startStack: async () => {
					started = true;
				},
			},
		}, async () => {
			probeCalls++;
			return started;
		});

		expect(handle.reusedExisting).to.be.false;
		expect(started).to.be.true;
		expect(probeCalls).to.be.greaterThan(0);
	});

	it('teardown invokes owned resources from startStack', async () => {
		let tornDown = false;
		let stackStarted = false;
		await E2EHarness.ensure({
			...baseConfig,
			startup: {
				startStack: async () => {
					stackStarted = true;
					return {
						teardown: async () => {
							tornDown = true;
						},
					};
				},
			},
		}, async () => stackStarted);

		expect(stackStarted).to.be.true;
		await E2EHarness.teardownActive();
		expect(tornDown).to.be.true;
	});
});
