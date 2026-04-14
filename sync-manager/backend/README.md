# @nu-art/sync-manager-backend

Backend module for smart-sync: maintains RTDB sync timestamps, serves the smartSync HTTP API, and automatically updates RTDB after every DB write.

## How it works

1. **`init()`** discovers all `ModuleBE_BaseDB` instances via `RuntimeBE_ModulesDB()`.
2. For each DB module, it registers a `PostWriteInterceptor` that calculates the maximum `__updated` timestamp from written/deleted items and writes it to the RTDB sync state at `/state/ModuleBE_SyncManager/syncData/{dbKey}/lastUpdated`.
3. The frontend `ModuleFE_SyncManager` sends its per-collection `lastUpdated` timestamps. The backend compares them against the RTDB state and responds with `NoNeedToSync`, `DeltaSync`, or `FullSync`.

**RTDB timestamps are updated automatically** — application code does not need to call `onPostWrite` manually.

## Sync flow

| Frontend sends | RTDB has | Result |
|---|---|---|
| `lastUpdated === remote.lastUpdated` | same | `SmartSync_UpToDateSync` — no data sent |
| `lastUpdated > 0` and `< remote.lastUpdated` | newer | `SmartSync_DeltaSync` — only items updated since `lastUpdated` |
| `lastUpdated === 0` or missing | any | `SmartSync_FullSync` — all items in collection |

## Deleted documents

The sync manager maintains a `deleted-docs` collection in Firestore. On `DeltaSync`, deleted items since the requested timestamp are included in the response so the frontend can remove them from IDB.

## Deps

- `@nu-art/sync-manager-shared` — types, ApiDef_SyncManager, DBDef_DeletedDoc, SyncableCollectionBE
- `@nu-art/firebase-backend` — ModuleBE_Firebase, FirestoreCollectionV3, DatabaseWrapperBE
- `@nu-art/firebase-shared` — FirestoreQuery
- `@nu-art/db-api-backend` — RuntimeBE_ModulesDB, ModuleBE_BaseDB (for PostWriteInterceptor registration)
- `@nu-art/http-server` — ApiHandler, HttpServer
- `@nu-art/ts-common` — Module, asArray, LogLevel
