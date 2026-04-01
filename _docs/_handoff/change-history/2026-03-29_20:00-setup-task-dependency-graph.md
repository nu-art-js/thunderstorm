# 2026-03-29 20:00 — Replace numeric setup priority with keyed dependency graph
- **Packages touched:** action-processor/backend, permissions/shared, permissions/backend, permissions/frontend
- **Concepts / docs:** PerformProjectSetup, SetupTask, SetupTaskKey; setup-action rule added to consuming rules

## Summary

Replaced numeric-priority `__performProjectSetup` with a branded `SetupTaskKey` dependency graph.

- `PerformProjectSetup` now returns `SetupTask[]` with `key`, `dependsOn`, and `processor`.
- `SetupTaskKey` is a branded string (`Brand<string, 'SetupTaskKey'>`) with `asSetupTaskKey()` util.
- Executor uses topological sort (Kahn's algorithm) with parallel execution per depth level.
- Validation: duplicate keys, missing deps, and cycles all throw `BadImplementationException`.
- Removed `setupPermissions` API endpoint — all setup flows through action-processor's `setup-project` action.
- Deleted duplicate `PerformProjectSetup` interface from `permissions/shared/project-setup.ts`.
- Added `@nu-art/action-processor-backend` dependency to `permissions/backend`.
- Documented the pattern in `_thunderstorm/.rules/consuming/setup-action.mdc` and added it to the rules index.
