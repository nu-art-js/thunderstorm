# @nu-art/app-config-backend

Backend module for app-config: Firestore-backed key-value config with optional per-key resolvers and data manipulators.

## Contents

- **ModuleBE_AppConfigDB** — Extends `ModuleBE_BaseDB` from `@nu-art/db-api-backend`. Registers keys (`AppConfigKey_BE`), resolves defaults, get/set/delete by key, `createDefaults()`, and `preWriteProcessing` (data manipulator).
- **ModuleBE_AppConfigAPI** — CRUD via `ModuleBE_BaseApi` plus custom route `getConfigByKey` (GET) using `@ApiHandler` from `@nu-art/http-server`.
- **AppConfigKey_BE** — Backend key descriptor: `key`, `resolver`, `dataManipulator`; registers with ModuleBE_AppConfigDB; `.get()`, `.set()`, `.delete()`.

## Wiring

1. Ensure **HttpServer** and **Firebase** are configured (e.g. default `HttpServer.getDefault()` and db-api’s Firebase usage).
2. Register **ModulePackBE_AppConfig** (or register `ModuleBE_AppConfigDB` and `ModuleBE_AppConfigAPI` individually) in your backend module list so `init()` runs.
3. API routes (CRUD + `getConfigByKey`) are registered when `ModuleBE_AppConfigAPI` is loaded.

## Dependencies

- `@nu-art/app-config-shared`, `@nu-art/db-api-backend`, `@nu-art/db-api-shared`, `@nu-art/http-server`, `@nu-art/ts-common`.
