# @nu-art/ui-test-harness

Fiber-driven React **render-audit engine**. It installs the React DevTools global hook, walks the
committed fiber tree on every commit, and runs **generic Tier-1 layout invariants** plus optional
**per-component contracts** — with no per-test assertion scripting and no per-component registration.

The React fiber tree is the universal oracle: for every committed class/function component it yields
`name`, all owned host roots in `nodes` (with `node` as `nodes[0]`), and `props`/`state`. The shipped
artifact imports **zero React** — it reaches the tree purely through the DevTools hook.

## Why

Agents (and humans) ship UI that is clickable but structurally broken: collapsed regions, zero-box
content, RTL-unsafe layouts. This harness auto-audits any component the moment it renders during a
journey, so those defects surface without bespoke assertions per screen.

## How it works

1. `installHook(onCommit)` sets `window.__REACT_DEVTOOLS_GLOBAL_HOOK__` **before** React initializes
   and wraps `onCommitFiberRoot` to forward each root to the audit. Idempotent; chains any existing hook.
2. `fiber.ts` is the **only** file touching fiber internals — `walkFibers`, `ownedHostNodesOf`,
   `extractComponent`, `domNodeOf` (one swappable adapter). Host roots are collected per component
   without crossing into nested component fibers; Suspense/Lazy boundaries are pass-through.
3. `RenderAudit.onCommit(root)` is debounced per commit: `requestAnimationFrame` when the document is
   visible, `setTimeout(0)` when `document.hidden` (background tab). It walks function, class, memo,
   and forwardRef component fibers. Class `state` and function hook values (call order) are extracted in
   `fiber.ts`. Per component, Tier-1 runs on **every** entry in `nodes`; contracts receive the full
   `ExtractedComponent`. Failures accumulate; `drain()` returns and clears them.

## Public API (`@nu-art/ui-test-harness`)

| Export | Purpose |
|---|---|
| `installHook(onCommit)` | Install/augment the DevTools hook; forwards each committed root fiber. |
| `RenderAudit` | The engine: `onCommit`, `registerContract(name, contract)`, `drain()`, `getTrace()`, `drainTrace()`. |
| `walkFibers`, `extractComponent`, `ownedHostNodesOf`, `domNodeOf`, `Fiber`, `FiberRoot`, `FiberTag`, `isComponentFiber` | The fiber adapter surface. |
| `runTier1(node)` | Generic layout invariants for a DOM node. |
| `ExtractedComponent`, `AuditFailure`, `AuditFailureKind`, `AuditTraceEntry`, `AuditTraceAction`, `AuditTraceOutcome`, `Contract`, `ContractMap` | Types. |

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
// Multi-host components: inspect t.nodes or run per-node checks in the contract.
// ... drive the app, then:
const failures = audit.drain();
```

## Trace API (test assertions)

Each audit walk emits structured trace entries (independent of logger routing — logger output may be
dropped when no `BeLogged` client is configured). Use `getTrace()` to inspect or `drainTrace()` to
assert and clear.

| Field | Values |
|---|---|
| `action` | `audit-start`, `tier1`, `contract`, `audit-complete` |
| `outcome` | `pass`, `fail`, `info` (walk boundaries) |
| `name` | Component fiber name, or `undefined` for walk summary entries |
| `detail` | Optional — failure detail (Tier-1 failures prefix the owning node, e.g. `node[1] data-testid="…": …`) or summary stats |

```ts
// Playwright — prove the walk ran and contracts passed
const trace = await page.evaluate(() => window.__uiTestHarness.drainTrace());
const contractPasses = trace.filter(e => e.action === 'contract' && e.outcome === 'pass');
expect(contractPasses.map(e => e.name)).toContain('AuthScreen');
expect(await page.evaluate(() => window.__uiTestHarness.drain())).toEqual([]);
```
