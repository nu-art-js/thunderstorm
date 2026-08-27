# 2026-06-26 19:28 — Remove hardcoded isLoading skip from render-audit engine
- **Author:** tacb0ss
- **Packages touched:** @nu-art/ui-test-harness

## Why

Loading is component-specific app state — two screens can model "busy" differently via props or state and render different loaders. The engine must not treat `state.isLoading` as a universal skip signal; that was a deprecated `ComponentAsync` convention. Loading UI is a valid layout target; whether to assert spinner vs content belongs in per-component contracts.

## What changed

- `RenderAudit.audit()` — removed `state.isLoading === true` skip branch; every component fiber is audited.
- `types.ts` — dropped `skip` from `AuditTraceAction`.
- Self-test — removed isLoading skip test; `StatefulProbe` uses generic `tick` state; removed `LoadingProbe`.
- README, ISSUES — removed isLoading skip documentation.
