# ISSUES — @nu-art/ui-test-harness

## File: `src/main/fiber.ts`

### Symbol: `Fiber`, `extractComponent()`, `ownedHostNodesOf()`, `domNodeOf()`

**Issue**: Depends on undocumented React fiber internals (work tags, `stateNode`, `memoizedProps`,
`child`/`sibling`, portal `containerInfo`).

**Details**: Tags `0/1/3/4/5/6/11/13/14/15/16/22` are stable across React 16–18 but are not a public contract.
This is intentionally isolated to this single adapter file so a React-version break has exactly one fix
site. Memo (`14`/`15`) and forwardRef (`11`) fibers are unwrapped for naming; hook values are read from
`memoizedState` on function and wrapper fibers. Suspense (`13`), Lazy (`16`), and Offscreen (`22`, React 18
deferred Suspense branches) are pass-through for host ownership — verified against react-dom@18.3.1.

`ownedHostNodesOf` / `domNodeOf` / `extractComponent` take a trailing `hasAssertion: UI_AssertionLookup`
(`(name: string | undefined) => boolean`) predicate so the ownership boundary is **assertion-aware**:
the walk stops only at a child component that HAS a registered assertion; assertion-less components are
transparent and their hosts bubble to the nearest asserted owner. The adapter stays pure — it never
imports `UI_AssertionEngine` or reaches a global; the predicate is the sole channel (`UI_AssertionEngine` supplies
`name => name != null && name in this.assertions`).

### Symbol: hook state extraction (`readHookStates`) + `hookKeys` registration

**Issue**: Hook values are positional in the fiber; named state requires declared `hookKeys` at registration.

**Details**: Reordering two **same-typed** hooks is not detectable by count alone — add/remove/type-change is.
Authors must keep `hookKeys` in `useState`/`useReducer` declaration order; drift guard halts when count mismatches.

## File: `src/main/exceptions.ts`

### Symbol: `ExceptionCapture`

**Issue**: Exception attribution and dedupe depend on React **dev** build console.error formatting.

**Details**: Production React minifies/suppresses messages; this channel targets test/journey environments only.
`window` error events may fire 2–3× per throw in dev — deduped per audit cycle. Boundary-handled throws are
still reported (by design). Fiber walk is not used as the exception trigger.

## File: `src/main/UI_AssertionEngine.ts`

### Symbol: `onCommit` (rAF debounce + hidden-tab fallback)

**Issue**: Assertion runs execute on `requestAnimationFrame` when the document is visible; when `document.hidden`,
`setTimeout(0)` is used instead because rAF is throttled in background tabs.

**Details**: The hidden-tab path is not deterministically exercised in Playwright headless — the
`document.hidden` property is read-only and headless Chromium typically reports visible. The fallback
is implemented and idempotent via the existing `scheduled` guard; manual verification in a backgrounded
browser tab is the practical check.

### Symbol: `getFirstFailure()` halt signal

**Issue**: First failure is sticky for the page lifetime — there is no reset API.

**Details**: Fresh Playwright pages (or navigation) are the expected isolation boundary. Re-running assertions
after a halt skips further assertion evaluation until reload. Trace still accumulates for observability.

### Symbol: `runAssertions()` — single renderer / single root

**Issue**: The engine assumes one React renderer and walks the committed root forwarded by the DevTools
hook.

**Details**: Multiple React roots or multiple renderers need explicit design before support (root
selection, per-root assertion scoping).

### Symbol: `runAssertions()` — trace buffer

**Issue**: Trace entries accumulate across commits until `drainTrace()`.

**Details**: Tests should drain trace after asserting; leaving it uncleared causes entries from later
commits to stack. Failures are **not** buffered — only `getFirstFailure()`.

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
