# 2026-07-05 21:53 — AwaitModules loader click logs dataStatus

## What changed

- Export `AwaitModule_LoaderProps` from sync-manager-frontend package index.
- `onLoaderClick`: log `{ name, dbKey, dataStatus }` per unprepared module instead of names only.

## Why

Custom loaders (e.g. AppShell_Skeleton) must receive `onClick`; when invoked, operators need `dataStatus` to distinguish sync-in-progress vs org-portal tenant-resolution gate (`UpdatingData` with cache present).
