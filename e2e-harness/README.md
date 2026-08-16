# @nu-art/e2e-harness

Abstract programmatic bootstrap for product E2E stacks. Products implement `startup.startStack` (mongo, Firebase emulators, Storm backend); this package only ensures, health-polls, and tears down.

## Purpose

`E2EHarness.ensure` makes a configured health URL reachable. It can reuse an already-running stack or call the product's `startStack` hook, then poll until GET succeeds. Tests must run via a single `bai -t -nb` — no manual pre-launch.

Product journeys (password-auth HTTP, Playwright portals) live in `@app/e2e` (or similar), not here.

## Usage

```ts
import {E2EHarness, type E2EHarnessConfig} from '@nu-art/e2e-harness';

const config: E2EHarnessConfig = {
	backendPackage: '@app/backend',
	healthUrl: 'https://localhost:8102/',
	reuseExistingStack: false,
	startup: {
		applyEnv: () => {
			process.env.NODE_TLS_REJECT_UNAUTHORIZED ??= '0';
			process.env.BACKEND_PORT ??= '8102';
		},
		startStack: startProductE2EStack,
	},
};

const handle = await E2EHarness.ensure(config);
await handle.teardown();
```

Child processes spawned from BAI mocha must **delete `NODE_OPTIONS`**. BAI registers `ts-node/esm` and that crashes `firebase` CLI and `node dist/index.js`.

## Public exports

| Symbol | Role |
|--------|------|
| `E2EHarness` | `ensure`, `teardownActive` |
| `E2EHarnessConfig` / `E2EHarnessHandle` / `E2EHarnessOwnedResources` / `E2EHarnessStartupHooks` | Config and session types |
| `waitForHealthUrl`, `createFetchHealthProbe`, `HealthProbe` | Health polling |
| `DEFAULT_READY_TIMEOUT_MS` (120s), `DEFAULT_POLL_INTERVAL_MS` (500ms) | Timing defaults |
