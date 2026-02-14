# Editable-Item Package — Import Dictionary

**Purpose:** Single reference for the next agent: where each symbol comes from, and which transformations apply.  
**Rule:** Never import from `@nu-art/thunderstorm-*`. Use infra packages only.

---

## Package → symbols (import from this package)

### @nu-art/ts-common
| Symbol | Notes |
|--------|--------|
| `_keys` | Object keys array |
| `ArrayType` | Array element type helper |
| `AssetValueType` | Prop type for asset values |
| `AwaitedDebounceInstance` | Debounce return type |
| `compare` | Deep equality |
| `deepClone` | Clone object |
| `deleteKeysObject` | Strip keys from object |
| `exists` | Null/undefined check |
| `generateHex` | Random hex string |
| `InvalidResult`, `InvalidResultObject` | Validation error shape |
| `isErrorOfType` | Error type guard |
| `KeysOfDB_Object` | DB metadata keys to strip (`_id`, `__created`, `__updated`, `_v`) — use for merge/strip with server response |
| `Logger` | Base logger |
| `mergeObject` | Shallow merge |
| `MUSTNeverHappenException` | Assertion failure |
| `queuedDebounce` | Debounced async fn |
| `RecursiveReadonly` | Readonly type helper |
| `removeFromArrayByIndex`, `removeItemFromArray` | Array utils |
| `ResolvableContent`, `resolveContent` | Lazy value resolution |
| `Second` | Time constant |
| `SubsetKeys` | Keys of T whose value is string (e.g. ref id) |
| `ValidationException` | Thrown by validators; use with `isErrorOfType` |
| `WhoCallThisException` | Debug caller info |
| `DB_Object`, `DBProto`, `DBPointer`, `UniqueId` | Used in other editable-item files (pages, controllers); DBProto is legacy entity shape — prefer CrudTypes where possible |
| `BadImplementationException`, `asArray`, `dbObjectToId`, `Filter`, `sortArray`, `ValidatorTypeResolver` | As needed |

### @nu-art/db-api-shared
| Symbol | Notes |
|--------|--------|
| `CrudTypes` | Type: `{ dbKey, dbItem, uiItem, validator, uniqueKeys }`. Use instead of DBProto for typing modules and editable items. |

### @nu-art/db-api-frontend
| Symbol | Notes |
|--------|--------|
| `ModuleFE_BaseApi` | Base API module: `config`, `cache`, `upsert(body)`, `delete(params)`, `validateImpl(item)`. **Transformation:** use via `ModuleForEditableItem<Types>` in editable-item (see Transformations below). |
| `BaseDBConfig` | Config shape for BaseDB/BaseApi (e.g. in tests). |

---

## Transformations (save time / tokens)

### ModuleFE_BaseApi → ModuleForEditableItem
- **Why:** db-api-frontend has no `dbDef`; it uses `config` and direct methods.
- **Use in editable-item:** `ModuleForEditableItem<Types> = ModuleFE_BaseApi<Types> & { generatedPropKeys?: (keyof Types['dbItem'])[] }`.
- **API mapping:**
  - `module.dbDef.dbKey` → `module.config.dbKey`
  - `module.v1.upsert(item).executeSync()` → `await module.upsert(item)` (returns `Promise<Types['dbItem']>`)
  - `module.v1.delete(item).executeSync()` → `await module.delete({ _id: item._id } as Params)` (delete takes params, not full item; use `Parameters<ModuleFE_BaseApi<Types>['delete']>[0]` for param type)
  - `module.dbDef.generatedProps` / `module.dbDef.generatedPropsValidator` → optional `module.generatedPropKeys` (array of keys to strip when merging response with UI item).

### CrudTypes vs DBProto
- **CrudTypes** (db-api-shared): `dbKey`, `dbItem`, `uiItem`, `validator`, `uniqueKeys`. Use for `EditableDBItemV3<Types>`, `editRefV3`, and module typing.
- **DBProto** (ts-common): legacy `uiType`, `dbType`, `preDbType`, etc. Do not use for new code in editable-item; use CrudTypes.

---

## Symbols that do not exist / not allowed

- **Do not import from:** `@nu-art/thunderstorm-frontend`, `@nu-art/thunderstorm-shared`, or any `@nu-art/thunderstorm-*`.
- **KeysOfDB_Object:** In db-api frontend it lives in `to-refactor/db-types.js`; in editable-item we use the one from **@nu-art/ts-common** so the package stays independent of db-api internals.

---

## Current package state (post-fix)

- **Build:** Package compiles with `bai -up=editable-item`. Only `core/EditableItem.ts` and `index.ts` are under `src/main`; they use only `@nu-art/ts-common`, `@nu-art/db-api-shared`, `@nu-art/db-api-frontend`.
- **Excluded from build:** Components, controllers, and Page_ItemsEditor that depended on missing or legacy packages were moved to `frontend/_excluded-from-build/` (folders: `_excluded_components`, `_excluded_controllers`, `_excluded_page`). They are not compiled. To restore them you must:
  - Add or replace deps: `@nu-art/web-client` and `@nu-art/storm-shared` do not exist in the workspace — add packages or replace usages (e.g. define `ApiCallerEventType` locally, remove web-client UI).
  - Fix imports: use `@nu-art/thunder-widgets` for `ComponentSync`, `TS_PropRenderer`, `FrameLayout`, `LL_H_C`, `LL_V_L`, `_className` (from thunder-core), `TS_Input`; use `module.config.dbKey` and `module.config` instead of `module.dbDef`; use dispatcher from module (no `defaultDispatcher` in db-api).
  - Align types: use `CrudTypes` and `ModuleForEditableItem` where the code currently uses `DBProto` and `ModuleFE_BaseApi<Proto>`.
- **Public API:** The package exports only the core: `EditableItem`, `EditableDBItemV3`, `ModuleForEditableItem`, status constants, and related types. See `src/main/index.ts`.

## Completion

- Package must compile (`bai -up=editable-item` or `bai -con`).
- If a symbol does not exist in any allowed package, document it here under "Symbols that do not exist / not allowed" and do not add a forbidden import.
