# Moving to Thunderstorm v2 — Base DB/API modules to db-api packages

## Problem

Packages currently use:
- **Backend:** `ModuleBE_BaseDB`, `DBApiConfigV3`, `createApisForDBModuleV3` from `@nu-art/thunderstorm-backend`
- **Frontend:** `ModuleFE_BaseApi` (and optionally `ModuleFE_BaseDB`) from `@nu-art/thunderstorm-frontend`
- **Shared types:** `DB_Object`, `DBProto`, `Proto_DB_Object`, `VersionsDeclaration` from `@nu-art/ts-common`
- **Generics:** `DBProto_*` and optional `Config` types

The new db-api packages replace all of this. DB type primitives, Proto infrastructure, and CrudTypes all come from `@nu-art/db-api-shared`. Each package composes its `CrudTypes` from its existing Proto; the infra does not depend on Proto.

## How to migrate

> In all examples below, replace `<Entity>` with your entity name (e.g. `Account`, `LoginAttempt`, `Session`), `<entity-db-key>` with its db key string (e.g. `'account'`, `'login-attempt'`), and `<Entity>s` with the plural used in your `DBDef_*` constant (e.g. `DBDef_Accounts`, `DBDef_Sessions`).

### 1. Shared — switch all DB types to `@nu-art/db-api-shared`

All DB type primitives now come from `@nu-art/db-api-shared` instead of `@nu-art/ts-common`:

| Old (from `@nu-art/ts-common`) | New (from `@nu-art/db-api-shared`) |
|---|---|
| `DB_Object` | `DB_Object<DBKey>` — generic over the db key; `_id` is branded per key |
| `DBProto<Proto>` | `DatabasePrototype<Proto>` |
| `Proto_DB_Object<...>` | `Proto_DB_Object<...>` (same name, from db-api-shared) |
| `VersionsDeclaration<...>` | `VersionsDeclaration<...>` (same name, from db-api-shared) |
| `UniqueId` (for foreign keys) | `DB_<OtherEntity>['_id']` (branded id from the referenced entity type) |

**Single import line replaces multiple ts-common imports:**

```typescript
import {CrudTypes, DatabasePrototype, DB_Object, Proto_DB_Object, VersionsDeclaration} from '@nu-art/db-api-shared';
```

**Entity DB type** — use `DB_Object<DBKey>` with your entity's db key type:

```typescript
type DBKey = '<entity-db-key>';

export type DB_<Entity> = DB_Object<DBKey> & {
	// entity-specific fields
}
```

**Proto** — use `DatabasePrototype` instead of `DBProto`:

```typescript
type Proto = Proto_DB_Object<DB_<Entity>, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;
export type DBProto_<Entity> = DatabasePrototype<Proto>;
```

**CrudTypes per entity** — compose from Proto fields (6 params: dbKey, dbType, uiType, editableType, validator, uniqueKeys):

```typescript
export type <Entity>CrudTypes = CrudTypes<
	DBProto_<Entity>['dbKey'],
	DBProto_<Entity>['dbType'],
	DBProto_<Entity>['uiType'],
	DBProto_<Entity>['editableType'],
	DBProto_<Entity>['modifiablePropsValidator'],
	DBProto_<Entity>['uniqueKeys']
>;
```

Because `DB_Object` comes from `@nu-art/db-api-shared` (branded `_id`), the types align with CrudTypes naturally — no `@ts-expect-error` needed.

Add dependency in shared `__package.json`: `"@nu-art/db-api-shared": "?"`.

### 2. Backend — switch base module and API factory

**Imports:**

| Old | New |
|-----|-----|
| `ModuleBE_BaseDB` from `@nu-art/thunderstorm-backend` | `ModuleBE_BaseDB` from `@nu-art/db-api-backend` |
| `DBApiConfigV3, ModuleBE_BaseDB` from `@nu-art/thunderstorm-backend` | `ModuleBE_BaseDB` from `@nu-art/db-api-backend` |

**Class:**

| Old | New |
|-----|-----|
| `extends ModuleBE_BaseDB<DBProto_<Entity>, Config>` | `extends ModuleBE_BaseDB<<Entity>CrudTypes>` or `extends ModuleBE_BaseDB<<Entity>CrudTypes, Config>` if you keep a custom config |
| `type Config = DBApiConfigV3<DBProto_<Entity>> & {...}` | Remove `DBApiConfigV3`; keep only your extra config shape (e.g. `type Config = { sessionTTLms: number; ... }`) |

**Module-pack:**

| Old | New |
|-----|-----|
| `createApisForDBModuleV3` from `@nu-art/thunderstorm-backend` | `createApisForDBModule` from `@nu-art/db-api-backend` |
| `createApisForDBModuleV3(ModuleBE_<Entity>DB)` | `createApisForDBModule(ModuleBE_<Entity>DB)` |

Add dependency in backend `__package.json`: `"@nu-art/db-api-backend": "?"`.

Existing `DBDef_*` (`DBDef_V3<Proto>`) is structurally compatible with the new base constructor; keep passing it to `super(DBDef_<Entity>s)` (or equivalent).

### 3. Frontend — switch base module and constructor

**Imports:** `ModuleFE_BaseApi` (and `ModuleFE_BaseDB` if used) from `@nu-art/db-api-frontend`. Import `CrudApiDef` from `@nu-art/db-api-shared` and `BaseDBConfig` from `@nu-art/db-api-frontend`.

**Class:** `extends ModuleFE_BaseApi<<Entity>CrudTypes>` (or your entity's CrudTypes).

**Constructor:** The new `ModuleFE_BaseApi` takes a single params object:

```typescript
super({
	config: <entity>BaseConfig,
	crudApiDef: CrudApiDef<<Entity>CrudTypes>(DBDef_<Entity>s.dbKey),
	dispatcher: <entity>Dispatcher
});
```

Build `config` from your existing `DBDef_*`:

```typescript
const <entity>BaseConfig: BaseDBConfig<<Entity>CrudTypes> = {
	dbKey: DBDef_<Entity>s.dbKey,
	validator: DBDef_<Entity>s.modifiablePropsValidator,
	uniqueKeys: (DBDef_<Entity>s.uniqueKeys ?? ['_id']) as <Entity>CrudTypes['uniqueKeys'],
	versions: DBDef_<Entity>s.versions,
	dbConfig: {
		name: DBDef_<Entity>s.frontend?.name ?? DBDef_<Entity>s.dbKey,
		group: DBDef_<Entity>s.frontend?.group ?? 'default',
		version: DBDef_<Entity>s.versions[0],
		uniqueKeys: (DBDef_<Entity>s.uniqueKeys ?? ['_id']) as (keyof DB_<Entity>)[]
	}
};
```

If you use a dispatcher, adapt it to db-api's `EventDispatcher` (e.g. wrap your `ThunderDispatcher` so `dispatchModule()` / `dispatchUI()` / `dispatchAll()` forward correctly).

Add dependencies in frontend `__package.json`: `"@nu-art/db-api-frontend": "?"`, `"@nu-art/db-api-shared": "?"`.

### 4. Dependencies

- **Shared:** `@nu-art/db-api-shared`
- **Backend:** `@nu-art/db-api-backend`
- **Frontend:** `@nu-art/db-api-frontend` and `@nu-art/db-api-shared`

Update both `__package.json` and (if present) generated `package.json` for each sub-package. Run `pnpm i --no-frozen-lockfile` from the repo root.

## Checklist

- [ ] Shared: All DB type imports (`DB_Object`, `DatabasePrototype`, `Proto_DB_Object`, `VersionsDeclaration`, `CrudTypes`) from `@nu-art/db-api-shared`
- [ ] Shared: Entity types use `DB_Object<DBKey>` (branded `_id`); foreign keys use `DB_<OtherEntity>['_id']`
- [ ] Shared: Proto uses `DatabasePrototype<Proto>` instead of `DBProto<Proto>`
- [ ] Shared: CrudTypes alias per entity (6 params: dbKey, dbType, uiType, editableType, validator, uniqueKeys)
- [ ] Shared: `@nu-art/db-api-shared` in `__package.json`
- [ ] Backend: `ModuleBE_BaseDB` from `@nu-art/db-api-backend`; generic = `<Entity>CrudTypes`; drop `DBApiConfigV3`
- [ ] Backend: `createApisForDBModule` from `@nu-art/db-api-backend` in module-packs
- [ ] Backend: `@nu-art/db-api-backend` in `__package.json`
- [ ] Frontend: `ModuleFE_BaseApi` from `@nu-art/db-api-frontend`; generic = `<Entity>CrudTypes`; constructor with config + crudApiDef + dispatcher
- [ ] Frontend: `@nu-art/db-api-frontend` and `@nu-art/db-api-shared` in `__package.json`
- [ ] Package compiles: `bai -up=<package-regex>`

## Reference

See `_thunderstorm/user-account` (shared, backend, frontend) for the first migrated example.
