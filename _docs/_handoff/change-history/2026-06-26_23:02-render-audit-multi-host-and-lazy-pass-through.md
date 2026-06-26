# 2026-06-26 23:02 — Render-audit multi-host ownership, Suspense/Lazy pass-through, hidden-tab scheduling
- **Author:** tacb0ss
- **Packages touched:** _thunderstorm/ui-test-harness
- **Concepts / docs:** render-audit engine, fiber adapter, Tier-1 multi-node

## Why

The render-audit engine was half-baked for real component trees: `domNodeOf` walked all descendants and
returned the first host anywhere in the subtree, so a parent could be assigned a DOM node owned by a
nested child, and multi-host components (fragments with several roots) only had their first node
audited. Suspense/Lazy boundaries and background-tab scheduling were uncovered gaps — inner lazy
components and second-host Tier-1 violations could slip through, and rAF-only debounce deferred audits
indefinitely when the tab was hidden.

## What changed

- `fiber.ts`: `ownedHostNodesOf` collects component-scoped host roots without crossing nested component
  fibers; Suspense (`13`) and Lazy (`16`) are pass-through; `ExtractedComponent.nodes` is SSOT,
  `node` derived as `nodes[0] ?? null`.
- `RenderAudit.ts`: Tier-1 runs on every owned node with node-index/testid in failure detail; `onCommit`
  uses `setTimeout(0)` when `document.hidden`.
- Self-test probes and Playwright assertions for multi-host, parent/child boundary, lazy/Suspense, and
  empirical fiber-tag verification.
- README and ISSUES updated; parked items documented (named hooks, RTL positional Tier-1, multi-root).

## Verified

`bash build-and-install.sh -t -tt=playwright -up=ui-test-harness`
