# 2026-06-27 08:53 — Remove redundant isComponentFiber wrapper

- **Author:** tacb0ss
- **Packages touched:** _thunderstorm/ui-test-harness (fiber.ts, RenderAudit.ts, README.md)
- **Concepts / docs:** render-audit fiber adapter surface

## Why

`isComponentFiber(fiber)` was a thin pass-through whose entire body was `isAuditableComponentTag(fiber.tag)` — it encapsulated nothing, only adding a second name and a layer of indirection over the real tag-level predicate. Two predicates for one decision violates single-source-of-truth. The fiber adapter already owns the canonical tag classification (`isAuditableComponentTag`, used internally by `collectOwnedHostRoots`); exposing that one predicate and letting the caller read `.tag` keeps a single boundary definition with no behavior change.

## What changed

- `fiber.ts`: `isAuditableComponentTag` is now `export`ed; the `isComponentFiber` function and its doc comment are deleted.
- `RenderAudit.ts`: import swaps `isComponentFiber` → `isAuditableComponentTag`; the audit walk guard is now `if (!isAuditableComponentTag(fiber.tag))`.
- `README.md`: fiber adapter surface table lists `isAuditableComponentTag` instead of `isComponentFiber`.
- Repo-wide grep confirms zero remaining `isComponentFiber` references.

## Verified

`bai -t -tt=playwright -up=ui-test-harness` — 21 passed.
