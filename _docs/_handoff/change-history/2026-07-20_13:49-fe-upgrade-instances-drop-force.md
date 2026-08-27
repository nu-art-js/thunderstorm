# 2026-07-20 13:49 — FE upgradeInstances always returns input
- **Author:** tacb0ss
- **Packages touched:** db-api/frontend, db-api/.rules
- **Concepts / docs:** version upgrade, IDB sync after upsert

## Why

FE `upgradeInstances(..., force=false)` returned only items that ran a processor. After upsert, docs already at the latest version (no processor for that version) were dropped from the return → callers got `undefined` → IDB `put` failed with missing key path. The `force` / `instancesToSave` split exists for backend collection migration (write back only what changed). FE only needs in-place upgrade and the full item set back — missing processor means skip, not discard.

## What changed

- `ModuleFE_BaseDB.upgradeInstances` — removed `force` and `instancesToSave`; always mutates in place and returns the input array
- `db-api/.rules/how-to-use.mdc` — FE API table updated
