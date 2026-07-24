# 2026-07-23 16:58 — IDB open respects physical version when registry lags
- **Author:** tacb0ss
- **Packages touched:** @nu-art/idb-frontend
- **Concepts / docs:** IDB_Database, store registry, VersionError

## Why

Org portal failed syncing `nodes` with:

`VersionError: The requested version (1) is less than the existing version (3).`

`IDB_Database._openImpl` derived the open version **only** from the localStorage store registry (`idb-stores--<dbName>`). When that key is missing or stale (cleared localStorage, private-mode edge cases, partial site-data wipe) while the physical IndexedDB for `knowledge-tree` (or any group) remains at a higher version, open requested `1` and IndexedDB rejected it — sync never recovered.

Physical IDB version is the source of truth for “what already exists”; the registry is a cache that can lag.

## What changed

- **`resolveExistingDbVersion()`** — read physical version via `indexedDB.databases()` (fallback: version-less open).
- **`_openImpl` version floor** — `max(minDbVersion, registryVersion, physicalVersion)`; upgrade path still `+ 1` when hash/forced upgrade requires it.
- **Registry heal on success** — rewrite localStorage when missing, version-lagged, or hash-mismatched after a successful open.
- **Logs** — Info line with Version / Physical / Registry; Warning when physical is ahead of registry.
- **Tests:** `browser/idb/frontend/src/test/upgrade/registry-cleared-existing-idb.test.playwright.ts` — registry cleared while IDB at v3; stale registry version below physical.

Key file: `browser/idb/frontend/src/main/IDB_Database.ts`

## Verified

```bash
bai -up=idb-frontend
bai -t -nb -tt=playwright -up=idb-frontend
```

97 passed, 2 skipped. Both new cases failed with the exact production VersionError before the fix; pass after.
