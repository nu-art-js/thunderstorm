# ISSUES — @nu-art/ui-test-harness

## File: `src/main/fiber.ts`

### Symbol: `Fiber`, `extractComponent()`, `domNodeOf()`

**Issue**: Depends on undocumented React fiber internals (work tags, `stateNode`, `memoizedProps`,
`child`/`sibling`, portal `containerInfo`).

**Details**: Tags `0/1/3/4/5/6` are stable across React 16–18 but are not a public contract. This is
intentionally isolated to this single adapter file so a React-version break has exactly one fix site.
`ForwardRef` / `Memo` (tags 11/14/15) are currently NOT treated as component targets — only function
(0) and class (1). Revisit if framework components wrapped in `forwardRef`/`memo` need first-class audit.

## File: `src/main/RenderAudit.ts`

### Symbol: `audit()` — `state.isLoading` skip

**Issue**: The skip predicate (`target.state?.isLoading === true`) bakes a consuming-app convention into
an otherwise feature-agnostic engine, and is effective for **class components only**.

**Details**: Function components expose no fiber state (`state` is always `undefined`), so a hooks-based
loading component cannot be skipped and may raise false Tier-1 failures while mid-load. The convention
also couples the engine to a specific app's `isLoading` flag. Planned for T2: replace the hardcoded
predicate with an injected skip predicate (registered like contracts), keeping the engine generic.

### Symbol: `onCommit` (rAF debounce)

**Issue**: Audits run on `requestAnimationFrame`. In a backgrounded tab rAF is throttled/paused, so an
audit may be deferred until the tab is foregrounded.

**Details**: Acceptable for Playwright (foregrounded headless). For non-test injection (T2+), consider a
`setTimeout` fallback when `document.hidden`.

### Symbol: `audit()` — trace buffer

**Issue**: Trace entries accumulate across commits until `drainTrace()` — same lifecycle as failures.

**Details**: Tests should drain trace after asserting; leaving it uncleared causes entries from later
commits to stack. `getTrace()` is non-destructive for mid-flight observation (e.g. waiting for a
specific component to appear in trace before draining failures).

## File: `src/main/*` — logging

### Symbol: framework logger in an injected artifact

**Issue**: The harness logs via `@nu-art/logger` (`Logger` / `StaticLogger`), which bundles `ts-common`
into the IIFE. Output routing depends on the host app's `BeLogged` client configuration (by design —
the host owns log routing); with no client configured, harness logs are silently dropped.

**Details**: Kept framework-first per coding rules rather than a bespoke console wrapper. The IIFE build
includes `vite-plugin-node-polyfills` to keep any Node-global references browser-safe.

## File: build wiring

### Symbol: dual build output (`dist/` vs `dist-iife/`)

**Issue**: `tsc` (BAI lib build) emits an ESM `dist/iife.js`; the injectable bundle is emitted separately
to `dist-iife/harness.iife.js` to avoid a same-path collision.

**Details**: The ESM `dist/iife.js` is unused (the package entry is `index.js`); only `dist-iife/harness.iife.js`
is a valid `addInitScript` target. Both dirs are gitignored.
