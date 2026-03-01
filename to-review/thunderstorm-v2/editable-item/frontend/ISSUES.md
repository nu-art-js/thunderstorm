# @nu-art/editable-item — ISSUES

## Excluded from build (code moved to `_excluded-from-build/`)

The following modules were moved out of `src/main` so the package compiles. They depend on packages or symbols that are not available or not allowed.

| Location | Reason |
|----------|--------|
| `_excluded_components/` | Imports `@nu-art/web-client` (no such package in workspace); `ComponentSync`, `TS_PropRenderer`, `_className`, `LL_H_C`, `LL_V_L`, `Grid`, `LinearLayoutProps` from `@nu-art/thunder-routing` (these live in `@nu-art/thunder-widgets` or `@nu-art/thunder-core`); `Proto` vs `CrudTypes` type errors. |
| `_excluded_controllers/` | Imports `@nu-art/storm-shared` (no such package); `@nu-art/web-client`; `module.defaultDispatcher` (db-api has no defaultDispatcher); `EditableDBItem`/`ModuleForEditableItem` typed with `Proto` instead of `CrudTypes`. |
| `_excluded_page/` | Imports `@nu-art/web-client`, `@nu-art/storm-shared`; `FrameLayout` from thunder-widgets (was thunder-widgets); `module.dbDef` (use `module.config`); React class component base (props/state/setState) and routing helpers. |

### To restore excluded code

1. **Dependencies:** Add `@nu-art/web-client` and `@nu-art/storm-shared` to the workspace (or replace their usage). For `ApiCallerEventType`, define locally or get from an allowed package.
2. **Imports:** Use `@nu-art/thunder-widgets` for `ComponentSync`, `TS_PropRenderer`, `FrameLayout`, layout components; `@nu-art/thunder-core` for `_className`. Use `module.config.dbKey` and optional `module.generatedPropKeys` instead of `module.dbDef`.
3. **Types:** Use `CrudTypes` and `ModuleForEditableItem<Types>` instead of `DBProto` and `ModuleFE_BaseApi<Proto>` where they interact with `EditableDBItem`.
4. **Move back:** Move `_excluded-from-build/_excluded_components`, `_excluded_controllers`, `_excluded_page` back into `src/main` as `components`, `controllers`, `page`, then fix the above and re-export from `index.ts` as needed.

See `_thunderstorm/editable-item-imports-dictionary.md` for the full symbol → package mapping and transformations.
