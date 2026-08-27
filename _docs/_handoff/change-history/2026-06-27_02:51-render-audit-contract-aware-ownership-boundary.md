# 2026-06-27 02:51 — Render-audit ownership boundary is now contract-aware

- **Author:** tacb0ss
- **Packages touched:** `@nu-art/ui-test-harness`
- **Concepts / docs:** render-audit ownership boundary, `fiber.ts` adapter surface (`ownedHostNodesOf`/`domNodeOf`/`extractComponent`), self-tests

## Why

`collectOwnedHostRoots` stopped descending at EVERY auditable child component (`isAuditableComponentTag`), including generic framework primitives like `LL_H_C` / `LL_V_C` that carry no registered contract and never will. A host rendered by such a contract-less primitive was therefore "claimed" by that primitive — which is never asserted — and became invisible to the nearest enclosing component that DOES have a contract. The boundary was wrong: it keyed off "is a component" instead of "is an assertion boundary".

The correct rule: ownership stops ONLY at the nearest child component that HAS a registered contract. A contract-less component is **transparent** — the walk descends through it so its hosts bubble up to the nearest contracted owner. This is what lets `AuthScreen` (root `LL_H_C className='beamz-auth-screen'`) own `.beamz-auth-screen` without reshaping the product (the prior, now-reverted, hack swapped `LL_H_C` for a raw `<div>` to satisfy the old boundary — see the Beamz-repo revert entry).

The adapter must stay a pure fiber adapter: it does not import `RenderAudit` or reach a global singleton. The contract knowledge is threaded in as a single `hasContract(name)` predicate — the only channel.

## What changed

- **`fiber.ts`** — added exported `HasContract = (name: string | undefined) => boolean`. Threaded `hasContract` through `ownedHostNodesOf`, `collectOwnedHostRoots`, `domNodeOf`, and `extractComponent`. The auditable-component branch now resolves the component name (`displayName ?? name`) and: if the name is present AND `hasContract(name)` → real boundary, advance to sibling (do not descend); otherwise → transparent, recurse into `cursor.child`. Host/portal/pass-through/default branches unchanged except for threading the predicate.
- **`RenderAudit.ts`** — `audit()` now calls `extractComponent(fiber, name => name != null && name in this.contracts)`, building the predicate from the registry the engine owns.
- **`test-entry.tsx`** — added `PlainWrapper` (contract-less, renders a host `div.plain-wrapper` around children, mimics `LL_H_C`) and `OwnerProbe` (contracted, delegates its root through `PlainWrapper`); mounted in `App`.
- **`harness.test.playwright.ts`** — added a transparency test (OwnerProbe owns the host rendered through the contract-less wrapper — fails on the old boundary, passes on the fix) and a fail-fast variant (real contract failure still halts for the nested-through-wrapper case). Updated the parent/child boundary test to register a contract for `ChildHostProbe` so it remains a real boundary under the contract-aware model (its intent — a contracted child is not claimed by the parent — is preserved).

## Verified

- `bai -t -tt=playwright -up=ui-test-harness` — 21 passed.
