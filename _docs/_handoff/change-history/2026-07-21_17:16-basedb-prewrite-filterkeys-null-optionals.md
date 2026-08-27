# 2026-07-21 17:16 — filterKeys in ModuleBE_BaseDB preWrite before validate
- **Author:** tacb0ss
- **Packages touched:** db-api/backend
- **Concepts / docs:** filterKeys, optional null fields, write-path normalization

## Why

Mongo (and object spreads) leave optional fields as `null`. Optional validators treat only `undefined`/absent as empty — e.g. a task `effort: null` failed update with `Invalid duration format: "null"`. ts-common already has `filterKeys` for stripping null/undefined keys; it belongs once in the DB write path, not as per-entity workarounds in every consuming app.

Triggered from Beamz task updates; the fix is framework-owned so every BaseDB backend inherits it.

## What changed

- `ModuleBE_BaseDB._preWriteProcessing` — `filterKeys(dbItem)` before interceptors / subclass preWrite / validate.

## Verified

- Beamz: superseded task update that previously failed on `effort: null` succeeded after this change.
