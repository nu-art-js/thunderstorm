# @nu-art/app-config-shared

Shared types, CRUD contract and API definitions for the app-config feature. Used by `@nu-art/app-config-backend` and `@nu-art/app-config-frontend`.

## Contents

- **types.ts** — `DB_AppConfig`, `UI_AppConfig`, constants (`DBKey_AppConfig`, `EntityName_AppConfig`, `Versions_AppConfig`).
- **crud-types.ts** — `Types_AppConfig` (CrudTypes), `CrudTypes_AppConfig`, `BaseDBDefBE_AppConfig`, `CrudApiDef_AppConfig`.
- **api-def.ts** — Custom API `getConfigByKey`: `ApiDef_AppConfig`, `RequestBody_GetResolverByKey`, `ApiStruct_AppConfig`.

## Dependencies

- `@nu-art/db-api-shared` — CrudTypes, CrudApiDef, DB_Object.
- `@nu-art/http-client` — ApiDefResolver, QueryApi, HttpMethod.
- `@nu-art/ts-common` — ValidatorTypeResolver, validators.

## Usage

Backend and frontend packages import from this package to stay in sync on entity shape, CRUD API paths and the getConfigByKey contract.
