# @nu-art/app-config-frontend

Frontend module for app-config: cache-backed key-value config with get/set/delete by key and optional `getConfigByKey` API call.

## Contents

- **ModuleFE_AppConfig** — Extends `ModuleFE_BaseApi` from `@nu-art/db-api-frontend`. Uses shared CrudTypes and CrudApiDef. Exposes `get(key)`, `set(key, data)`, `delete(key)` by app-config key; and `getConfigByKey(params)` (GET) via `@ApiCaller`.
- **AppConfigKey_FE** — Frontend key descriptor: `key` only; `.get()`, `.set()`, `.delete()` delegate to ModuleFE_AppConfig.

## Wiring

1. Set **HttpClient.default** (origin, etc.) so API calls reach the backend.
2. Register **ModulePackFE_AppConfig** (or **ModuleFE_AppConfig** alone) in your frontend module list so `init()` runs and cache/IDB/sync are ready.

## Dependencies

- `@nu-art/app-config-shared`, `@nu-art/db-api-frontend`, `@nu-art/db-api-shared`, `@nu-art/http-client`, `@nu-art/ts-common`.
