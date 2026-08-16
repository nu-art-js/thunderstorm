/*
 * @nu-art/e2e-harness - Abstract programmatic bootstrap for product E2E stacks
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

export {E2EHarness} from './E2EHarness.js';
export {
	createFetchHealthProbe,
	DEFAULT_POLL_INTERVAL_MS,
	DEFAULT_READY_TIMEOUT_MS,
	waitForHealthUrl,
	type HealthProbe,
} from './health-check.js';
export type {
	E2EHarnessConfig,
	E2EHarnessHandle,
	E2EHarnessOwnedResources,
	E2EHarnessStartupHooks,
} from './types.js';
