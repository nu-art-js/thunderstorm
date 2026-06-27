# @nu-art/ui-test-harness

Fiber-driven React **render-audit engine**. It installs the React DevTools global hook, walks the
committed fiber tree on every commit, and runs **state-aware per-component assertions** over the
coherent `(props, state, dom)` — with fail-fast halt on the first failure or unexpected exception.

The React fiber tree is the universal oracle: for every committed class/function component it yields
`name`, all owned host roots in `nodes` (with `node` as `nodes[0]`), `props`, and `state`/`hooks`.
The shipped artifact imports **zero React** — it reaches the tree purely through the DevTools hook.

## Why

Agents (and humans) ship UI that is clickable but structurally broken for its current state — or that
throws during render. This harness auto-audits any registered component the moment it renders during
a journey, so state-relative layout defects and render exceptions surface without bespoke assertions
per screen.

## How it works

1. `installHook(onCommit)` sets `window.__REACT_DEVTOOLS_GLOBAL_HOOK__` **before** React initializes
   and wraps `onCommitFiberRoot` to forward each root to the audit. Idempotent; chains any existing hook.
2. `fiber.ts` is the **only** file touching fiber internals — `walkFibers`, `ownedHostNodesOf`,
   `extractComponent`, `domNodeOf` (one swappable adapter). Host roots are collected per component
   with an **assertion-aware** ownership boundary: `ownedHostNodesOf`/`domNodeOf`/`extractComponent`
   take a `hasAssertion: (name) => boolean` predicate and stop descending only at a child component
   that HAS a registered assertion. Assertion-less components (generic primitives like `LL_H_C`, or
   unregistered wrappers) are **transparent** — their hosts bubble up to the nearest asserted
   owner. Suspense/Lazy boundaries remain pass-through. The adapter never imports `UI_AssertionEngine` or a
   global singleton; the predicate is the only channel — `UI_AssertionEngine` passes
   `name => name != null && name in this.assertions`.
3. `UI_AssertionEngine.onCommit(root)` is debounced per commit: `requestAnimationFrame` when the document is
   visible, `setTimeout(0)` when `document.hidden`. On each pass it collects props + state + dom,
   runs registered assertions, and **halts on the first** assertion failure, hook-key drift, or
   unexpected render/lifecycle exception.
4. `ExceptionCapture` listens to `window` `error` / `unhandledrejection` and intercepts `console.error`
   (React dev builds emit structured component attribution). Handled **and** unhandled errors are
   reported; allowlist via `registerExpectedException` for negative tests.

## Public API (`@nu-art/ui-test-harness`)

| Export | Purpose |
|---|---|
| `installHook(onCommit)` | Install/augment the DevTools hook; forwards each committed root fiber. |
| `UI_AssertionEngine` | Engine: `onCommit`, `registerAssertion(name, assertion, options?)`, `registerExpectedException`, `getFirstFailure()`, `getTrace()`, `drainTrace()`. |
| `walkFibers`, `extractComponent`, `ownedHostNodesOf`, `domNodeOf`, `Fiber`, `FiberRoot`, `FiberTag`, `isComponentTag`, `UI_AssertionLookup` | Fiber adapter surface. `extractComponent`/`ownedHostNodesOf`/`domNodeOf` take a trailing `hasAssertion: UI_AssertionLookup` predicate (assertion-aware ownership boundary). |
| `ExtractedComponent`, `UI_AssertionFailure`, `UI_AssertionFailureKind`, `UI_AssertionTrace`, `UI_Assertion`, `UI_AssertionOptions`, `ExpectedException` | Types. |

## Halt signal (page → Playwright)

The engine records the **first** failure on the singleton audit instance:

```ts
window.__uiTestHarness.getFirstFailure(): UI_AssertionFailure | null
```

Playwright tests wait for run completion via trace (`run-complete`) or for halt via:

```ts
await page.waitForFunction(() => window.__uiTestHarness.getFirstFailure() !== null);
const failure = await page.evaluate(() => window.__uiTestHarness.getFirstFailure());
```

Clean runs: `getFirstFailure()` stays `null` after `run-complete` appears in trace.

## Function-component state via `hookKeys`

```ts
audit.registerAssertion('Component_X', assertion, { hookKeys: ['loading', 'error', 'data'] });
// with keys    → state = { loading: hooks[0], error: hooks[1], data: hooks[2] }
// without keys → positional hooks[] on ExtractedComponent; class state unchanged
```

Declared key count must equal observed hook count — mismatch halts with a drift message.

## Expected exceptions (negative tests)

```ts
audit.registerExpectedException({
  component: 'ThrowExpectedProbe',
  messageSubstring: 'expected-probe-boom',
});
```

Matches fiber `displayName ?? name` and a substring of the captured error message.

## The IIFE artifact

`src/main/iife.ts` installs the hook and publishes `window.__uiTestHarness`. `vite build` bundles it
to `dist-iife/harness.iife.js` for Playwright `addInitScript` (before the app's React boots).

## Build & test (BAI only)

```bash
bai -up=ui-test-harness                      # build (tsc lib)
bai -t -tt=playwright -up=ui-test-harness    # self-test (builds the IIFE in globalSetup, then runs)
```

Never use raw `tsc`/`npx tsc` or `pnpm` here.

## Usage sketch

```ts
import {UI_AssertionEngine, installHook} from '@nu-art/ui-test-harness';

const audit = new UI_AssertionEngine();
installHook(audit.onCommit);                 // before createRoot
audit.registerAssertion('LoginButton', t => {
  if (t.state?.busy)
    return t.node?.querySelector('.spinner') ? undefined : 'busy but no spinner';
  return t.node?.textContent?.trim() ? undefined : 'empty label when idle';
}, { hookKeys: ['busy'] });
// ... drive the app; first failure halts and is readable via getFirstFailure()
```

## Trace API (observability)

Trace accumulates for debugging; **failures do not**. Use `getTrace()` / `drainTrace()` to assert
walk boundaries and assertion pass/fail steps — not as a failure collection mechanism.

| Field | Values |
|---|---|
| `action` | `run-start`, `assertion`, `hook-drift`, `exception`, `run-complete` |
| `outcome` | `pass`, `fail`, `info`, `halt` |
| `name` | Component fiber name, or `undefined` for walk summary entries |

```ts
const trace = await page.evaluate(() => window.__uiTestHarness.drainTrace());
expect(trace.some(e => e.action === 'run-complete')).toBe(true);
expect(await page.evaluate(() => window.__uiTestHarness.getFirstFailure())).toBeNull();
```
