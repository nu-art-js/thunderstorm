# 2026-06-26 22:44 — Fiber adapter: memo, forwardRef, hook state
- **Author:** tacb0ss
- **Packages touched:** @nu-art/ui-test-harness

## Why

T1 only audited raw function/class fibers (tags 0/1). Real Beamz components use memo and forwardRef; function loading/busy state lives in hooks, not class `state`. Contracts could not see wrapped names or hook values.

## What changed

- `fiber.ts` — audit tags 11/14/15; unwrap inner type for `displayName ?? name`; `readHookStates()` from `memoizedState` chain; `ExtractedComponent.hooks` for function/wrapper fibers.
- Self-test probes: `MemoProbe`, `MemoHookProbe`, `ForwardRefProbe`, `HookStateProbe` + Playwright contracts.
