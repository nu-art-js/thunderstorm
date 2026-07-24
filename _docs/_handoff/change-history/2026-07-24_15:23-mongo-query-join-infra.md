# 2026-07-24 15:23 — Mongo typed multi-hop query.join in db-api
- **Author:** tacb0ss
- **Packages touched:** @nu-art/db-api-shared, @nu-art/firebase-backend, @nu-art/db-api-backend
- **Concepts / docs:** CrudJoinHopCompiled, MongoInterface.buildJoinPipeline, ModuleBE_BaseDB.query.join

## Why

Beamz uses Mongo for product data but had no first-class way to run multi-collection joins with the same per-module `manipulateQuery` / access interceptors as ordinary queries. App-level `$in` chains duplicate access logic and still pay full candidate read cost for unindexed regex. Product search (knowledge body) needs Node → Assignment → Doc in one aggregate while keeping each hop’s filters authoritative.

## What changed

- **db-api-shared** — `CrudJoinHopCompiled` / `CrudJoinQueryCompiled`; hop `where` typed as `CrudClause_Where<any>` for foreign-side predicates.
- **firebase-backend** — `MongoInterface.compileWhereClause`, `buildJoinPipeline` ($match → $lookup/$unwind per hop → optional whereAfter → sort/limit); `MongoCollection.query.join` runs aggregate with session opts.
- **db-api-backend** — `join-query-types` (caller passes foreign `module`); `ModuleBE_BaseDB.query.join` (mongo-only fail-fast, local + per-hop compiled where, pipeline execute); public `compileQueryWhere`.
- **Tests** — `mongo-interface-query.test.ts` pipeline shape; `ModuleBE_BaseDB_join.test.ts` firestore fail-fast + mongo stub verifying interceptors in pipeline.
