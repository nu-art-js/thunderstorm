# 2026-07-13 12:45 — MemStorage parent-chain inheritance for nested contexts
- **Author:** tacb0ss
- **Packages touched:** `@nu-art/ts-common`
- **Concepts / docs:** MemStorage, MemKey, AsyncLocalStorage, service-account nesting

## Why

Nested `MemStorage.init()` contexts (e.g. `runAsServiceAccount` inside an HTTP request) created an isolated store with no link to the enclosing context. Values set on the parent before entering the child — such as `sessionOrganizationId` during org handoff JWT mint — were invisible to `MemKey.peak()` inside the child, so session-data collectors omitted `activeOrganizationDomain` / `activeOrganizationId` from the JWT. The org portal then threw when `assertOrgContext` read a missing claim.

Copying the parent cache at init time was the old workaround and was not applied when no explicit `enclosingContextStorage` was passed. The correct model is override semantics: child contexts keep a parent ref; reads walk the chain until a value resolves; writes stay on the current level.

## What changed

- **`MemStorage`** — added `parent` link; `init` / `initSync` auto-link to `enclosingContextStorage` or the active store at entry; `get` walks the parent chain instead of snapshot-copying cache entries.
- **`src/test/mem-storage/mem-storage.test.ts`** — pure tests for parent reads, child override, three-level chain, explicit parent, `initSync`, unique-key behavior, and the service-account nesting pattern.

## Verified

- `bai -t -nb -tt=pure -up=ts-common` — green (includes new MemStorage suite).
