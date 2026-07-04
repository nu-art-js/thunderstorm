# 2026-07-04 12:36 — Bootstrap account permission identity without login
- **Author:** tacb0ss
- **Packages touched:** permissions/backend
- **Concepts / docs:** personal access group, default group, registration bootstrap, MemKey_UserAccessIds export

## Why

`__onUserLogin` ensures personal access group and default group membership — correct for returning users, wrong for inline registration flows that create an account and immediately write permission-gated documents in the same transaction before any login event fires. Org registration needed explicit bootstrap of permission identity after account create.

Also, registration access-context helpers in consuming apps need to read/write `MemKey_UserAccessIds`; it was module-internal only.

## What changed

- `ModuleBE_Permissions.ts` — `ensureAccountPermissionIdentity(account)` runs personal group + default group under bootstrap service account (mirrors login hook subset without requiring login).
- `index.ts` — export `MemKey_UserAccessIds`, `MemKey_UserScopePermissions`, `MemKey_ServiceAccountId` for registration/bootstrap wiring in apps.

## Verified

Beamz org registration calls `ensureAccountPermissionIdentity` before org create; access context establish/rematerialize uses exported mem key.
