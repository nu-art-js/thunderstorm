# 2026-07-04 12:35 — Extract password-auth registration composables
- **Author:** tacb0ss
- **Packages touched:** auth/password/backend
- **Concepts / docs:** account registration, password assertion, transactional create

## Why

Org registration (`registerOrganization`) and standalone password registration (`registerAccount`) both need the same steps: assert password rules, create account row, credentials, mem keys, and `onAccountCreated`. Duplicating that inside organization DB bypassed password-auth's module boundary and blocked reuse inside a larger outer transaction (org + profile + unit).

Extracting `assertRegistrationPassword` and `createRegisteredAccount` on `ModuleBE_PasswordAuth` gives consuming features a single composable entry point while `registerAccount` API handler delegates to the same helpers.

## What changed

- `ModuleBE_PasswordAuth.ts` — public `assertRegistrationPassword`, `createRegisteredAccount`; `registerAccount` handler refactored to call them inside existing transaction.

## Verified

Beamz `ModuleBE_OrganizationDB.registerOrganization` now calls these helpers; standalone registerAccount path unchanged behaviorally.
