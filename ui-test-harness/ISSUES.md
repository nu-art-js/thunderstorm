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

### Symbol: hook state extraction (`readHookStates`)

**Issue**: Hook values are positional (call order), not named.

**Details**: Extracting named hook state (e.g. `useState` variable names) would require fragile
React-dispatcher parsing. Out of scope by decision — contracts should assert on `hooks[n]` order or
use props/DOM instead.

## File: `src/main/tier1.ts`

### Symbol: positional / RTL layout invariants

**Issue**: Tier-1 checks visibility and box size only — no logical-direction or RTL positional checks.

**Details**: Speculative until a concrete invariant needs position; any future positional check must use
logical inline-start/end, never hardcoded left/right.

## File: `src/main/RenderAudit.ts`

### Symbol: `onCommit` (rAF debounce + hidden-tab fallback)

**Issue**: Audits run on `requestAnimationFrame` when the document is visible; when `document.hidden`,
`setTimeout(0)` is used instead because rAF is throttled in background tabs.

**Details**: The hidden-tab path is not deterministically exercised in Playwright headless — the
`document.hidden` property is read-only and headless Chromium typically reports visible. The fallback
is implemented and idempotent via the existing `scheduled` guard; manual verification in a backgrounded
browser tab is the practical check.

### Symbol: `audit()` — single renderer / single root

**Issue**: The engine assumes one React renderer and walks the committed root forwarded by the DevTools
hook.

**Details**: Multiple React roots or multiple renderers need explicit design before support (root
selection, per-root contract scoping).

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
