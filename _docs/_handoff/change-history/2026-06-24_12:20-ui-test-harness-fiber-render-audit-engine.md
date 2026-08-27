# 2026-06-24 12:20 — Add @nu-art/ui-test-harness — fiber-driven React render-audit engine (T1)

- **Author:** $USER
- **Packages touched:** _thunderstorm/ui-test-harness (new)
- **Concepts / docs:** React DevTools global hook, fiber walk/extract, Tier-1 layout invariants, RenderAudit (onCommit/drain), IIFE injection artifact

## Why

Agents (and humans) ship UI that is clickable but structurally broken — collapsed regions, zero-box
content, RTL-unsafe layouts — and catching it today means bespoke assertions per screen. We want a
harness that **auto-audits any React component the moment it renders**, with no per-test assertion
scripting and no per-component registration. The React fiber tree is the universal oracle: for every
committed class/function component it yields name + live DOM node + props/state. T1 builds this engine
in isolation and proves it with a Playwright self-test, before any Beamz wiring (T2) — so the engine is
validated as a standalone, zero-coupling artifact first.

Key design decisions and their motivation:

- **Zero React import in the shipped artifact.** The harness reaches the tree purely via the DevTools
  global hook, so it can be injected into any React app without version/runtime coupling. React appears
  only as a **test devDependency** (the self-test must render a real tree to audit). This is the whole
  point of the architecture, hence the hard constraint.
- **One fiber adapter (`fiber.ts`).** All React-internal knowledge (work tags, `stateNode`,
  `memoizedProps`, portal `containerInfo`) is isolated to a single swappable file, so a React-version
  break has exactly one fix site.
- **rAF-debounced audits + `drain()`.** Commits coalesce into one audit per frame, run after layout so
  box measurements are valid; failures accumulate until drained. Added a non-destructive `peek()` so
  external observers (tests) can wait deterministically for an audit to complete rather than racing a
  fixed frame count (React 18 `createRoot().render()` commits asynchronously).
- **IIFE built to `dist-iife/` (separate from tsc `dist/`).** BAI's playwright runner only starts a vite
  **dev server** and never runs `vite build`; tsc also emits an ESM `dist/iife.js` that would collide.
  So the self-contained injectable bundle is produced in Playwright `globalSetup` (`vite build`) and
  emitted to `dist-iife/harness.iife.js`, which the self-test injects via `addInitScript` — proving the
  REAL shippable artifact, not a tsc stand-in. An authored (not BAI-generated) `playwright.config.ts`
  wires `globalSetup` and serves the page via the package-local React-aware `vite.config.ts`.
- **Framework logging.** Uses `@nu-art/logger` (`Logger`/`StaticLogger`); the host app owns log routing
  via `BeLogged` (see ISSUES.md for the injected-artifact trade-off).

## What changed

- New infra package `@nu-art/ui-test-harness` under `_thunderstorm/ui-test-harness/`:
  - `src/main/`: `install.ts` (DevTools hook installer, idempotent), `fiber.ts` (walk/extract/domNodeOf —
    the only fiber-internals file), `tier1.ts` (visibility + non-zero-box, direction-agnostic),
    `RenderAudit.ts` (`onCommit`/`drain`/`peek`/`registerContract`), `iife.ts` (side-effect entry),
    `index.ts` (ESM public surface), `types.ts`.
  - `src/test/`: Playwright self-test (`harness.test.playwright.ts`) + throwaway React page
    (`test-entry.tsx`, `index.html`), `global-setup.ts` (builds the IIFE).
  - `vite.config.ts` (dev server + `build.lib` IIFE), `playwright.config.ts`, package-standard files
    (LICENSE, README, ISSUES, `.gitignore`, copyright headers, `__package.json`).
- The self-test mounts a plain `React.Component` (state present), a function component (no state), a
  deliberately collapsed function component (trips Tier-1), and a loading class component (skipped). It
  asserts `drain()` returns EXACTLY the seeded contract failure + the collapsed-node Tier-1 failure, and
  that an `isLoading:true` component is skipped while a non-loading control is still audited.

## Verified

- `bai -up=ui-test-harness` — compiles clean (tsc), no lint errors.
- `bai -t -tt=playwright -up=ui-test-harness` — **2 passed** (IIFE built in globalSetup, injected via
  addInitScript; trigger → extract → assert → drain proven end-to-end with zero Beamz dependency).
