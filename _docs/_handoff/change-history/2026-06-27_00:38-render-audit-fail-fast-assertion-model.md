# 2026-06-27 00:38 — Render-audit fail-fast assertion model

## Why

Zero-size / hidden DOM is a valid rendering of some component states (loading, collapsed, measuring) — a state-free Tier-1 verdict was wrong. Contracts must judge layout relative to `(props, state, dom)`. Collecting failures via `drain()` also hid the first actionable problem behind a lossy buffer; fail-fast halt surfaces one fixable issue per run.

## What changed

- **Removed Tier-1** — deleted `tier1.ts`, `runTier1`, failure buffer, `drain()`/`peek()`, and `AuditFailureKind = 'tier1'`.
- **Three-truths contracts** — `RenderAudit` runs registered contracts per commit over coherent props + state + dom; first contract failure halts via `getFirstFailure()`.
- **`hookKeys` + drift guard** — `registerContract(name, fn, { hookKeys })` builds named function-component `state`; count mismatch halts with an explicit drift message.
- **Exception capture** — `ExceptionCapture` on `window` error/rejection + `console.error`; handled and unhandled dev errors halt unless `registerExpectedException({ component, messageSubstring })`.
- **Halt signal** — `getFirstFailure(): AuditFailure | null` on `window.__uiTestHarness` for Playwright `waitForFunction`.
- **Self-tests** — rewrote `harness.test.playwright.ts` / `test-entry.tsx` for all branches; empirical `render-exception-probe` left intact.
- **Docs** — README + ISSUES updated to the new model.
