# 2026-07-23 16:46 — deepClone must preserve RegExp (query $regex)
- **Author:** tacb0ss
- **Packages touched:** ts-common
- **Concepts / docs:** deepClone, MongoCollection manipulateQuery clone

## Why

`MongoCollection._customQuery` deepClones the query before interceptors. `deepClone` treated `RegExp` as a POJO (`Object.keys` → `[]`), producing `{}`. That broke `knowledge.search` after `$regex: RegExp` landed — MongoInterface correctly rejected the empty object.

## What changed

- `deepClone`: `instanceof RegExp` → `new RegExp(source, flags)` before POJO clone
- Pure test coverage for nested RegExp clone

## Verified

- `bai -up=ts-common,firebase-backend,beamz-backend`
- `bai -t -nb -tt=pure -up=ts-common,firebase-backend` — deepClone RegExp + MongoInterface suites green
- Live `knowledge.search({query:'create-task'})` → `/tasks/management/create-task`
