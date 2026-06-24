# @nu-art/ui-test-harness

Fiber-driven React **render-audit engine**. It installs the React DevTools global hook, walks the
committed fiber tree on every commit, and runs **generic Tier-1 layout invariants** plus optional
**per-component contracts** — with no per-test assertion scripting and no per-component registration.

The React fiber tree is the universal oracle: for every committed class/function component it yields
`name`, the live DOM `node`, and `props`/`state`. The shipped artifact imports **zero React** — it
reaches the tree purely through the DevTools hook.

## Why

Agents (and humans) ship UI that is clickable but structurally broken: collapsed regions, zero-box
content, RTL-unsafe layouts. This harness auto-audits any component the moment it renders during a
journey, so those defects surface without bespoke assertions per screen.

## How it works

1. `installHook(onCommit)` sets `window.__REACT_DEVTOOLS_GLOBAL_HOOK__` **before** React initializes
   and wraps `onCommitFiberRoot` to forward each root to the audit. Idempotent; chains any existing hook.
2. `fiber.ts` is the **only** file touching fiber internals — `walkFibers`, `extractComponent`,
   `domNodeOf` (one swappable adapter).
3. `RenderAudit.onCommit(root)` is `requestAnimationFrame`-debounced; it walks the tree and, per
   function/class component, runs Tier-1 invariants and any registered contract. Targets reporting
   `state.isLoading === true` are skipped. Failures accumulate; `drain()` returns and clears them.

## Public API (`@nu-art/ui-test-harness`)

| Export | Purpose |
|---|---|
| `installHook(onCommit)` | Install/augment the DevTools hook; forwards each committed root fiber. |
| `RenderAudit` | The engine: `onCommit`, `registerContract(name, contract)`, `drain()`. |
| `walkFibers`, `extractComponent`, `domNodeOf`, `Fiber`, `FiberRoot`, `FiberTag`, `isComponentFiber` | The fiber adapter surface. |
| `runTier1(node)` | Generic layout invariants for a DOM node. |
| `ExtractedComponent`, `AuditFailure`, `AuditFailureKind`, `Contract`, `ContractMap` | Types. |

## The IIFE artifact

`src/main/iife.ts` is a side-effect entry (no exports) that installs the hook and publishes a
singleton `window.__uiTestHarness`. `vite build` bundles it self-contained to `dist-iife/harness.iife.js`
for injection into a page via Playwright `addInitScript` (before the app's React boots).

## Build & test (BAI only)

```bash
bai -up=ui-test-harness                      # build (tsc lib)
bai -t -tt=playwright -up=ui-test-harness    # self-test (builds the IIFE in globalSetup, then runs)
```

Never use raw `tsc`/`npx tsc` or `pnpm` here.

## Usage sketch

```ts
import {RenderAudit, installHook} from '@nu-art/ui-test-harness';

const audit = new RenderAudit();
installHook(audit.onCommit);                 // before createRoot
audit.registerContract('LoginButton', t => t.node?.textContent ? undefined : 'empty label');
// ... drive the app, then:
const failures = audit.drain();
```
