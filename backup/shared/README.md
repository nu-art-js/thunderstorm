# @nu-art/backup-shared

Shared types and API definitions for the backup feature (Firestore backup to Storage, scheduled backups). Used by backup-backend.

## Contents

- **types** — `DB_BackupDoc`, `DBProto_BackupDoc`, `FetchBackupDoc`, `BackupMetaData`, etc.
- **db-def** — `DBDef_BackupDoc` for the backup status Firestore collection
- **apis** — `ApiDef_BackupDoc`, `Request_BackupId`, `Response_BackupDocs`

## Deps

- `@nu-art/api-types`, `@nu-art/ts-common`

No `@nu-art/thunderstorm-*` dependency.
