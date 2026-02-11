# @nu-art/sync-manager-backend

Backend module for sync-manager: exposes `onPostWrite` (app calls it after writes) and smartSync HTTP API. Uses Firebase (Firestore + RTDB) for deleted-docs and sync state. Does not depend on db-api; the app wires db-api (or any collection layer) to sync.

## Deps

- `@nu-art/sync-manager-shared` — types, ApiDef_SyncManager, DBDef_DeletedDoc, SyncableCollectionBE, SyncPostWriteData, SyncPostWriteOptions
- `@nu-art/firebase-backend` — ModuleBE_Firebase, FirestoreCollectionV3, DatabaseWrapperBE
- `@nu-art/firebase-shared` — FirestoreQuery
- `@nu-art/http-server` — ApiHandler, HttpServer
- `@nu-art/ts-common` — Module, LogLevel, etc.

## Usage

1. Create an instance with a callback that returns syncable collections:  
   `new ModuleBE_SyncManager_Class(getSyncableCollections)`  
   where `getSyncableCollections: () => SyncableCollectionBE[]`.
2. Call `init()` after Firebase and HTTP server are ready.
3. The app is responsible for calling `syncManager.onPostWrite(collectionName, data, options)` after every create/set/update/delete that should be synced (db-api does not call sync).

No `@nu-art/thunderstorm-*` or `@nu-art/db-api-*` dependency.

## How to hook db-api backend to sync

### 1. Supply `getSyncableCollections()`

For each `ModuleBE_BaseDB` you have, implement `SyncableCollectionBE` by delegating to it:

- **dbKey:** `module.dbDef.dbKey`
- **queryUpdatedSince(since):**  
  `module.query.custom({ where: { __updated: { $gte: since } } })`
- **getNewestTimestamp():**  
  `module.query.unManipulatedQuery({ limit: 1, orderBy: [{ key: '__updated', order: 'desc' }] })`  
  then return `[0]?.__updated ?? 0`

Pass an array of these (one per collection) to the constructor via `getSyncableCollections()`.

### 2. Write notifications

db-api no longer calls sync. After every create/set/update/delete that goes through your DB module, call:

`syncManager.onPostWrite(collectionName, data, options)`

with the same payload: collection name (`dbDef.dbKey`), updated/deleted items (same shape as the collection’s post-write data), and options (`uniqueKeys`, `transaction`). The app must either wrap the write path (e.g. a facade that calls the DB module then the sync manager) or register a post-write callback in its own layer and invoke the sync manager from there.

## Sync response orchestration

The sync manager builds the sync response for a collection and since timestamp: `querySyncResponse(collection, since)` returns `{ toUpdate, toDelete }` by calling `collection.queryUpdatedSince(since)` and querying deleted items from its own store.
