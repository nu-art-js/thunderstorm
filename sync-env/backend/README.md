# @nu-art/sync-env-backend

Backend module for syncing environment data (backup/restore across envs). Exposes HTTP routes and uses injectable BackupProvider and DB registry; no `@nu-art/thunderstorm-*` dependency.

## Deps

- `@nu-art/sync-env-shared` — API defs and types
- `@nu-art/http-server` — ApiHandler, HttpServer
- `@nu-art/http-client` — outgoing requests
- `@nu-art/firebase-backend` — Firestore batch write (optional; can be abstracted)
- `@nu-art/ts-common` — Module, Dispatcher, etc.

## Exports

- `ModuleBE_SyncEnv_Class`, `OnSyncEnvCompleted`, provider interfaces
