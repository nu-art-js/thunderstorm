# @nu-art/sync-manager-shared

Shared types, API definitions and deleted-doc entity for the sync-manager feature. Used by sync-manager-backend and sync-manager-frontend.

## Deps

- `@nu-art/api-types` — ApiDefResolver, BodyApi, HttpMethod
- `@nu-art/ts-common` — DB_Object, TypedMap, Minute, DBDef_V3, DBProto, etc.

## Exports

- **Types:** `LastUpdated`, `SyncDataFirebaseState`, `Response_DBSync`, `SyncDbData`, `NoNeedToSyncModule`, `DeltaSyncModule`, `FullSyncModule`, `SmartSync_UpToDateSync`, `SmartSync_DeltaSync`, `SmartSync_FullSync`
- **APIs:** `SyncManagerAPI_SmartSync`, `ApiStruct_SyncManager`, `ApiDef_SyncManager`
- **Deleted-doc:** `DB_DeletedDoc`, `DBProto_DeletedDoc`, `UI_DeletedDoc`, `DBDef_DeletedDoc`

No `@nu-art/thunderstorm-*` dependency.
