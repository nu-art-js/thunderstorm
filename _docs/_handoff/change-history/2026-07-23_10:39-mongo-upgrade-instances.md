# 2026-07-23 10:39 — MongoCollection.upgradeInstances for collection upgrade
- **Author:** tacb0ss
- **Packages touched:** firebase/backend
- **Concepts / docs:** upgradeCollection, Mongo parity with Firestore

## Why

`ModuleBE_BaseDB.upgradeCollection` persists via `this.collection.upgradeInstances` after in-memory version processors. That method existed only on FirestoreCollection; Mongo backends threw `upgradeInstances is not a function` when ATS Collection Upgrades ran against Beamz (mongo default).

## What changed

- `MongoCollection.upgradeInstances` — `_setAll(..., performUpgrade=false, unmanipulatedExisting=true)` so migrated docs are written without re-running processors and without access-filtered existing lookups dropping rows mid-migrate
