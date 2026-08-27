# 2026-07-24 14:11 — Distributive branded DBPointer; deprecate brandless
- **Author:** tacb0ss
- **Packages touched:** `@nu-art/db-api-shared`, `@nu-art/ts-common`
- **Concepts / docs:** DBPointer, DB_UniqueId branding

## Why

`DBPointer<'docs' | 'tasks'>` was a single object with uncorrelated union fields, so `dbKey === 'docs'` did not narrow `id` to `DB_UniqueId<'docs'>`. Call sites then cast. Making the type distributive restores brand correlation after narrowing. The brandless twin in ts-common (`dbKey: string; id: UniqueId`) is marked deprecated so new code uses the branded form.

## What changed

- `@nu-art/db-api-shared` `DBPointer<Key>` — distributive conditional: `Key extends infer K … ? { dbKey: K; id: DB_UniqueId<K> } : never`
- `@nu-art/ts-common` `DBPointer` — `@deprecated` pointing at branded `DBPointer<Key>` from db-api-shared
- `db-api/shared/src/test/type-tests.ts` — compile-time narrowing assertions for the distributive form

## Verified

- `bai -up=ts-common,db-api-shared,beamz-backend` — success
- `bai -t -nb -tt=pure -up=db-api-shared` — success (no runtime suite in package)
