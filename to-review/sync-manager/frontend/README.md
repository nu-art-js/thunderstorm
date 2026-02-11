# @nu-art/sync-manager-frontend

Frontend client for sync-manager: calls the smartSync API and hands the response to a callback. The app is responsible for applying delta/full/no sync to each module (e.g. db-api-frontend modules); this package does not depend on db-api.

## Deps

- `@nu-art/sync-manager-shared` — types, ApiDef_SyncManager
- `@nu-art/http-client` — HttpClient, createRequest
- `@nu-art/ts-common` — Module, debounce, etc.

## Usage

1. Create an instance with `getLocalSyncData` (returns `SyncDbData[]` for each module to sync) and `onSmartSyncCompleted` (called with the server response; apply delta/full/no sync per module).
2. Call `smartSync()` to perform a sync (e.g. on app load or when connectivity is restored).
3. Optional: use `setBaseUrl` if the API is on a different origin.

No `@nu-art/thunderstorm-*` or `@nu-art/db-api-*` dependency. No RTDB listener in this package; the app can listen to sync state elsewhere and call `smartSync()` when needed.

## How to hook db-api frontend to sync

### getLocalSyncData

Return `SyncDbData[]`: for each `ModuleFE_BaseDB` (or equivalent) that participates in sync, add  
`{ dbKey: module.getCollectionKey(), lastUpdated: module.IDB.getLastSync() }`.

### onSmartSyncCompleted

For each entry in the response that has **delta** or **full** data:

- Find the frontend module whose `getCollectionKey()` matches `response.dbKey`.
- For **delta:** the response includes `items: { toUpdate, toDelete }`. Call  
  `module.applyBatch(items.toUpdate, items.toDelete)`.
- For **full:** the response does not include items. The app must load full data (e.g. via the CRUD API or a full export), then call  
  `module.applyBatch(toUpdate, toDelete)`  
  with that data (and optionally an empty `toDelete` if no deletes yet).

For **up-to-date** entries, no apply is needed.
