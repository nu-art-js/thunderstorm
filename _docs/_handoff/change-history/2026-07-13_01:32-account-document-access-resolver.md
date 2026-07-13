# 2026-07-13 01:32 — Account and session document access resolvers
- **Author:** tacb0ss
- **Packages touched:** `@nu-art/permissions-backend`
- **Concepts / docs:** access-model.md account stamping, AccessContextResolver

## Why

Beamz routes all account creation through apex register/invite, but sessions are also created on login and org handoff minting. Session rows had no `__access`, so session reissue during `setActive` failed on `delete.all` (403 — superseded session rows not deletable under user context). Auth entity access policy lives in `permissions-backend` (the layer above `user-account-backend` that can register resolvers without inverting deps).

## What changed

- **`ModuleBE_Permissions.init`** — `accountAccessResolver` + `sessionAccessResolver` registered on `ModuleBE_AccountDB` / `ModuleBE_SessionDB` before `wireDocumentAccessToAllModules`.
- Session resolver keyed on `accountId`; `deleters` includes personal group (required for reissue housekeeping under user context).
- Bootstrap SA wraps on session **create** (open-api / handoff paths): org `createOrgScopedSessionJwt` / `mintApexLauncherSession`; password `login`.

## Verified

- Compiles with `@app/organization-backend` consumer; apex-register test asserts stamped shape when create runs under bootstrap SA (wired in beamz org module).
