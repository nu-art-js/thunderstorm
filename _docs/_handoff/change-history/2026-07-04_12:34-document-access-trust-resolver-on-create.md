# 2026-07-04 12:34 — Trust AccessContextResolver __access verbatim on create
- **Author:** tacb0ss
- **Packages touched:** permissions/backend (document-access-enforcement)
- **Concepts / docs:** document access, pre-write interceptor, AccessContextResolver

## Why

On document create, the pre-write interceptor always merged resolver output with the writer's `AccessScope_Self` ids into `owners`. Domain resolvers that intentionally stamp group-only access (e.g. org registration wiring orgAdminGroupId on org/profile/unit) were overwritten — self ids leaked into `owners` and the effective ACL did not match the resolver's contract.

Consuming apps register resolvers when they know the correct ACL for a new row (bootstrap, tenant scope). The framework should apply resolver `__access` verbatim when a resolver exists; only the no-resolver path should fall back to default creator self stamping.

## What changed

- `document-access-enforcement.ts` — if `resolverProvider()` returns a resolver, assign `item.__access = resolved.__access` with no self-id merge; else keep `defaultAccessFields(selfIds)`.

## Verified

Beamz org registration path — org/profile/unit rows expected to carry orgAdminGroupId-only access after resolver wiring lands in consuming app.
