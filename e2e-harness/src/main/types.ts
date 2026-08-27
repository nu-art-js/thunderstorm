/*
 * @nu-art/e2e-harness - Abstract programmatic bootstrap for product E2E stacks
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

/** Resources owned by a harness-owned stack bootstrap (for teardown). */
export type E2EHarnessOwnedResources = {
	teardown: () => Promise<void>;
};

/** Consumer-provided hooks for env, ports, and programmatic stack start. */
export type E2EHarnessStartupHooks = {
	/** Apply env vars before bootstrap (ports, emulator hosts, TLS flags). */
	applyEnv?: () => void;
	/**
	 * Start mongo/firebase/backend when the health URL is unreachable.
	 * Return owned resources when this process spawned the stack.
	 */
	startStack?: () => Promise<E2EHarnessOwnedResources | void>;
};

/** Config injected by the product E2E consumer (e.g. `@app/e2e`). */
export type E2EHarnessConfig = {
	/** npm package key for the backend entry (documentation + future BAI integration). */
	backendPackage: string;
	/** GET URL polled until reachable (typically backend root over HTTPS). */
	healthUrl: string;
	readyTimeoutMs?: number;
	pollIntervalMs?: number;
	/** When false, always runs startup.startStack even if healthUrl already responds. Default true. */
	reuseExistingStack?: boolean;
	startup?: E2EHarnessStartupHooks;
};

/** Active harness session returned by {@link E2EHarness.ensure}. */
export type E2EHarnessHandle = {
	readonly config: Readonly<E2EHarnessConfig>;
	/** True when an already-running stack was reused (e.g. human dev session). */
	readonly reusedExisting: boolean;
	teardown(): Promise<void>;
};
