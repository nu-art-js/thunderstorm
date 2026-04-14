# @nu-art/backup-backend

Backend module for Firestore backup to Firebase Storage: backup status collection, initiate-backup and fetch-backup-docs HTTP APIs, and optional scheduled backup (every 24h). Uses `@nu-art/firebase-backend`, `@nu-art/http-server`; no `@nu-art/thunderstorm-*` dependency.

## Config (before init)

Call `ModuleBE_BackupDocDB.configureBackup(config)` before the module is initialized:

- **getModulesToBackup** (required) — returns list of backupable DB modules (e.g. `ModuleBE_BaseDB` from db-api-backend). Each must have `dbDef: { dbKey, versions }` and `query.unManipulatedQuery(query)`.
- **onCleanup** (optional) — called before backup (e.g. clear caches).
- **upgradeCollections** (optional) — called before backup (e.g. run collection upgrades).
- **excludedDbKeys** (optional) — dbKeys to skip.
- **keepInterval** (optional) — ms to keep backups (default 7 days).
- **minTimeThreshold** (optional) — ms between backups (default 1 day).
- **getSignedUrlContentType** (optional) — Content-Type for signed URLs.
- **httpClient** (optional) — for `getBackupInfo(backupId, baseUrl, headers)` and stream fetch (e.g. used by sync-env).

## Routes

Registered via `@ApiHandler` with `HttpServer.getDefault()`:

- `GET v1/initiate-backup-v2` — start backup (optional query `pathToBackup`).
- `GET v1/fetch-backup-docs-v2` — fetch backup doc by `backupId` (query).

## Scheduler

`ModuleBE_BackupScheduler` runs every 24 hours and calls `ModuleBE_BackupDocDB.initiateBackup(true)`. Wire the scheduler in your Firebase functions entry if needed.

## Exports

- `ModuleBE_BackupDocDB_Class`, `ModuleBE_BackupDocDB`, `ModuleBE_BackupScheduler`
- `BackupableModule`, `BackupDocDBConfig`
