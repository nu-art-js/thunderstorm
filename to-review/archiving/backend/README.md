# @nu-art/archiving-backend

Backend module for document archiving and TTL: archives document state to `_archived` sub-collections, exposes HTTP APIs for hard-delete and document history. Uses `@nu-art/firebase-backend` (Firestore listener) and `@nu-art/db-api-backend` (BaseDB).

## Deps

- `@nu-art/archiving-shared` — API defs and request types
- `@nu-art/ts-common`, `@nu-art/firebase-backend`, `@nu-art/firebase-shared`, `@nu-art/db-api-backend`, `@nu-art/http-server`

## Module discovery

The replica does **not** use Storm runtime. Register DB modules explicitly:

- **Constructor:** pass an optional initial map: `new ModuleBE_ArchiveModule_Class({ moduleMapper: { [collectionPath]: dbModule } })`.
- **Or** use the singleton and call `ModuleBE_Archiving.registerModule(collectionPath, dbModule)` for each `ModuleBE_BaseDB` you want to support for archiving.

Routes are registered via `@ApiHandler` with `HttpServer.getDefault()`.

## Exports

- `Const_ArchivedCollectionPath`, `ModuleBE_ArchiveModule_Class`, `ModuleBE_Archiving`

No `@nu-art/thunderstorm-*` dependency.
