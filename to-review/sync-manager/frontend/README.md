# @nu-art/sync-manager-frontend

Frontend client for sync-manager: calls the smartSync API and hands the response to a callback. The app (or an adapter using db-api-frontend) is responsible for applying delta/full/no sync to each module (cache, IDB, etc.).

## Deps

- `@nu-art/sync-manager-shared` — types, ApiDef_SyncManager
- `@nu-art/http-client` — HttpClient, createRequest
- `@nu-art/ts-common` — Module, debounce, etc.

## Usage

1. Create an instance with `getLocalSyncData` (returns `SyncDbData[]` for each module to sync) and `onSmartSyncCompleted` (called with the server response; apply delta/full/no sync per module).
2. Call `smartSync()` to perform a sync (e.g. on app load or when connectivity is restored).
3. Optional: use `setBaseUrl` if the API is on a different origin.

No `@nu-art/thunderstorm-*` dependency. No RTDB listener in this package; the app can listen to sync state elsewhere and call `smartSync()` when needed.
