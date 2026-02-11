# @nu-art/sync-manager-backend

Backend module for sync-manager: implements `SyncNotifier` (used by ModuleBE_BaseDB), exposes smartSync HTTP API. Uses Firebase (Firestore + RTDB) for deleted-docs and sync state.

## Deps

- `@nu-art/sync-manager-shared` — types, ApiDef_SyncManager, DBDef_DeletedDoc
- `@nu-art/db-api-backend` — ModuleBE_BaseDB type
- `@nu-art/firebase-backend` — ModuleBE_Firebase, FirestoreCollectionV3, DatabaseWrapperBE
- `@nu-art/http-server` — ApiHandler, HttpServer
- `@nu-art/ts-common` — Module, LogLevel, etc.

## Usage

1. Create an instance with a callback that returns the list of BaseDB modules:  
   `new ModuleBE_SyncManager_Class(getDbModules)`  
   where `getDbModules: () => (ModuleBE_BaseDB<any>)[]`.
2. Call `init()` after Firebase and HTTP server are ready (e.g. after app has registered all BaseDB modules).
3. Pass the same instance as `syncNotifier` in BaseDB config when constructing your DB modules.
4. Register the HTTP server (ApiHandler registers the smartSync route at instance creation).

No `@nu-art/thunderstorm-*` dependency.
