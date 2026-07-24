# 2026-07-23 16:40 — Query $regex + $or; Mongo compile from RegExp
- **Author:** tacb0ss
- **Packages touched:** firebase/shared, firebase/backend, db-api/shared, db-api/backend (test mocks), db-api/e2e (test mocks)
- **Concepts / docs:** Clause_Where, QueryComparator, MongoInterface, FirestoreInterface

## Why

`knowledge.search` (and any future path/label-style filter) could not push RegExp into Mongo — the shared query layer only had Firestore-parity comparators. Call sites pulled whole collections and filtered in memory, burning read tier for work Mongo can do. Extending `$regex` / `$or` in the query types with Mongo compile (and Firestore fail-fast) is the infra prerequisite so product actions stop paying that cost.

## What changed

- `QueryComparator` / `CrudQueryComparator`: `$regex: RegExp`
- `Clause_Where` / `CrudClause_Where`: `$or?: Clause_Where<T>[]`
- `MongoInterface`: RegExp → `{ $regex: source, $options: flags }`; compiles `$or`
- `FirestoreInterface`: fail-fast on `$regex` / `$or`
- Test mocks `filterByWhere` understand `$regex` / `$or`
- Pure tests: `firebase/backend/src/test/mongo-interface-query.test.ts`

## Verified

- `bai -up=firebase-shared,firebase-backend,db-api-shared,db-api-backend,beamz-mcp-backend,beamz-backend`
- `bai -t -nb -tt=pure -up=firebase-backend` — 5 passing
