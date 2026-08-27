/*
 * @nu-art/e2e-harness - Abstract programmatic bootstrap for product E2E stacks
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {
	createFetchHealthProbe,
	DEFAULT_POLL_INTERVAL_MS,
	DEFAULT_READY_TIMEOUT_MS,
	type HealthProbe,
	waitForHealthUrl,
} from './health-check.js';
import type {E2EHarnessConfig, E2EHarnessHandle, E2EHarnessOwnedResources} from './types.js';

class E2EHarnessSession implements E2EHarnessHandle {
	constructor(
		readonly config: Readonly<E2EHarnessConfig>,
		readonly reusedExisting: boolean,
		private readonly ownedTeardown?: () => Promise<void>,
	) {}

	async teardown(): Promise<void> {
		if (this.ownedTeardown)
			await this.ownedTeardown();
		E2EHarness.clearActive(this);
	}
}

/** Programmatic lifecycle for full product stacks (Storm backend + emulators + health gates). */
export class E2EHarness {
	private static active: E2EHarnessSession | undefined;

	/**
	 * Ensures the configured stack is reachable.
	 * Reuses an already-running stack when the health URL responds.
	 */
	static async ensure(
		config: E2EHarnessConfig,
		probe: HealthProbe = createFetchHealthProbe(),
	): Promise<E2EHarnessHandle> {
		if (E2EHarness.active && await probe(config.healthUrl))
			return E2EHarness.active;

		config.startup?.applyEnv?.();

		const reuseExisting = config.reuseExistingStack ?? true;
		if (reuseExisting && await probe(config.healthUrl)) {
			const handle = new E2EHarnessSession(config, true);
			E2EHarness.active = handle;
			return handle;
		}

		if (!config.startup?.startStack)
			throw bootstrapNotImplementedError(config);

		const owned = await config.startup.startStack();
		await waitForHealthUrl(
			config.healthUrl,
			probe,
			config.readyTimeoutMs ?? DEFAULT_READY_TIMEOUT_MS,
			config.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS,
		);
		const handle = new E2EHarnessSession(config, false, resolveOwnedTeardown(owned));
		E2EHarness.active = handle;
		return handle;
	}

	/** Tear down the active harness session, if any. */
	static async teardownActive(): Promise<void> {
		await E2EHarness.active?.teardown();
	}

	static clearActive(session: E2EHarnessSession): void {
		if (E2EHarness.active === session)
			E2EHarness.active = undefined;
	}
}

function resolveOwnedTeardown(owned: E2EHarnessOwnedResources | void): (() => Promise<void>) | undefined {
	if (!owned?.teardown)
		return undefined;
	return owned.teardown.bind(owned);
}

function bootstrapNotImplementedError(config: E2EHarnessConfig): Error {
	return new Error(
		`E2E harness: programmatic bootstrap for ${config.backendPackage} is not implemented yet. ` +
		`Implement startup.startStack in the consumer config. ` +
		`Health URL: ${config.healthUrl}. ` +
		'Tests must run via a single `bai -t -nb` command — no manual pre-launch.',
	);
}
