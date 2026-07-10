# 2026-07-10 17:33 — clearWebsiteData dispatcher fans out to all FE layers
- **Type:** change-history
- **Domain:** thunder-core, db-api-frontend, sync-manager-frontend, thunder-ui-modules

## What changed

- `OnClearWebsiteData` listeners added on `ModuleFE_BaseDB` (per-store IDB + MemCache via `clearData()`) and `ModuleFE_SyncManager` (`cancelSync` + `stopListening`).
- `ModuleFE_LocalStorage.clearPersistedStorage()` extracted as the direct localStorage-only API; `__onClearWebsiteData` delegates to it.
- `ModuleFE_Thunderstorm.clearWebsiteData()` uses `dispatchModuleAsyncSerial` so layers clear in registration order.
- `clearAllRegisteredModuleDbData()` exported from `@nu-art/db-api-frontend` for IDB-only targeted cleanup.

## Why

`clearWebsiteData` was documented as full client cleanup but only cleared localStorage — IndexedDB (synced entity cache) survived logout, causing phantom data when a second user landed in the same browser. Each persistence layer now owns its wipe via the single dispatcher; targeted cleanup calls the layer directly.

## For the next agent

- Full wipe: `ModuleFE_Thunderstorm.clearWebsiteData()` or `dispatch_onClearWebsiteData.dispatchModuleAsyncSerial()`.
- localStorage only: `ModuleFE_LocalStorage.clearPersistedStorage()`.
- IDB only: `clearAllRegisteredModuleDbData()`.
- Do not use `cleanIDBStorage()` for app logout paths — it `deleteDatabase`s and hangs on open connections.
