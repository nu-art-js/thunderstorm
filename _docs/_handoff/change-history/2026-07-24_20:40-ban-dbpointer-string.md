# 2026-07-24 20:40 — Ban DBPointer\<string\>; migrate pointers; drop Doc id casts
- **Author:** tacb0ss
- **Packages touched:** `@nu-art/db-api-shared`, `@nu-art/ts-common`, `@app/knowledge-tree-*`, `@app/tagging-*`, `@app/counter-shared`, `@app/prompt-shared`, `@app/beamz-mcp-backend`
- **Concepts / docs:** DBPointer, DBPointerOf, branded ids

## Why

Bare `DBPointer<string>` erased brands and forced `as …['_id']` after runtime `dbKey` checks. Rejecting general `string` on distributive `DBPointer`, plus closed key unions at call sites, makes narrowing carry the brand so Doc lookups no longer need id casts. `DBPointerOf` keeps construction type-safe when `Key` is a closed union (distributive `DBPointer` is a union of objects).

## What changed

- `DBPointer` — distributive; `IsGeneralString` → `never` for bare `string`; `DBPointerOf` for construction; `asDBPointer` helper
- Brandless ts-common `DBPointer` remains `@deprecated`
- Entity targets closed: NodeAssignment → `docs`; TagAssignment → `nodes` \| `task`; Counter parent → `project`; Prompt placeholder → prompt package keys
- Removed `assignment.target.id as DatabaseDef_Doc['dbType']['_id']` in knowledge node + sky knowledge actions
- Tag assign wire schema validates `TagAssignmentTargetDbKeys`

## Verified

- `bai -all` (partial) then `bai -con` — Completed successfully
