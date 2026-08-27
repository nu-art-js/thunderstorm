# 2026-07-12 22:17 — IDB open-in-flight late createStore race and forced upgrade heal
- **Author:** tacb0ss
- **Packages touched:** @nu-art/idb-frontend
- **Concepts / docs:** IDB_Database, store registry hash, beamz IDB group

## Why

Beamz org portal stuck on `AwaitModules` for `ModuleFE_Tag` / `ModuleFE_TagAssignment` with `dataStatus: NoData`. Smart-sync reported tags up-to-date, but `loadCache` failed with `NotFoundError: object stores was not found`. Physical IndexedDB had 3 org stores while the in-memory registry had 5 — tag stores registered **after** `open()` started but **before** `onsuccess`.

Root cause in `IDB_Database`: `createStore` was allowed while `openPromise` was in flight; `needsUpgrade` was computed once at `_openImpl` start from the then-current `storeConfigs`, so late stores never triggered `onupgradeneeded`. A second `open()` short-circuited on `this.db` without re-validating physical stores.

First fix (missing-store detection + reopen) exposed a second bug: when localStorage registry hash already matched the full store set, reopen set `needsUpgrade=false`, skipped upgrade, and looped forever (`Registered stores missing from IDB: tags, tag-assignments — reopening with upgrade`).

## What changed

- **`IDB_Database.open()`** — if connection is open but registered stores are missing physically, close and force upgrade.
- **`_openImpl({ forceUpgrade, minDbVersion })`** — when physical stores are missing, bump version to `max(dbVersion, registryVersion) + 1` regardless of registry hash match so `onupgradeneeded` always runs.
- **`onsuccess`** — validate physical stores before assigning `this.db`; on mismatch, chain a forced-upgrade reopen (atomic `openPromise` replacement).
- **`close()`** — null `this.db` so a subsequent open can run.
- **Retry cap** — `MaxMissingStoreUpgradeAttempts = 5`; fail fast instead of infinite loop.
- **Tests:** `browser/idb/frontend/src/test/upgrade/open-in-flight-late-create-store.test.playwright.ts` — Test A (late createStore during open creates stores + `getAll` works), Test B (second `open()` heals).

Key file: `browser/idb/frontend/src/main/IDB_Database.ts`

## Verified

```bash
bai -t -nb -tt=playwright -up=idb-frontend -tf=src/test/upgrade/open-in-flight-late-create-store.test.playwright.ts
bai -t -nb -tt=playwright -up=idb-frontend
```

95 passed, 2 skipped (pre-existing). Org portal tags UI confirmed working after fix (manual).

## For the next agent

- Commit in `_thunderstorm` first, then bump submodule pointer in beamz.
- Do **not** work around at app level (separate IDB group, manual IDB clear) — the infra fix is the correct layer.
- Allowed pattern: `createStore` during `open()` in flight is supported; `_openImpl` heals via forced upgrade before resolving.
