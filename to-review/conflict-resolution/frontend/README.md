# @nu-art/conflict-resolution-frontend

Frontend module and UI for resolving entity dependency conflicts. When the backend returns a dependency error (e.g. delete blocked by references), this package shows a tree of conflicting entities and lets the user navigate to resolve them. Integrates with thunderstorm-frontend (ModuleFE_BaseDB, XHR error handling) and uses shared types from `@nu-art/conflict-resolution-shared`.

## Package purpose

Provides `ModuleFE_ConflictResolution`, the conflict resolution overlay/panel, and the conflict resolution tree component. Apps wire the module and register per-entity renderers via `ConflictResolutionItem`; the module hooks into XHR default error handling to show the UI when the backend returns `DBEntityDependencyErrorType`.

## Installation and usage

- Add `@nu-art/conflict-resolution-frontend` and `@nu-art/conflict-resolution-shared` as dependencies in `__package.json` of the app frontend.
- Import and add the module to the frontend module pack so the singleton is created.
- Call `ModuleFE_ConflictResolution.initDefaultHasDependencyResponse()` to set XHR default error handler for dependency errors.
- Register conflict resolution items: `ModuleFE_ConflictResolution.registerConflictResolutionItem(item | items[])` with `ConflictResolutionItem` from shared.
- Export the overlay/panel/ATS from the package and mount the overlay in the app layout; include the ATS screen in the app tools screen list if desired.

## Key features

- **ModuleFE_ConflictResolution** — Singleton module: `initDefaultHasDependencyResponse()`, `showDependencies()`, `registerConflictResolutionItem()`.
- **Overlay_ConflictResolution** — Full-screen overlay that hosts the panel.
- **Panel_ConflictResolution** — Panel with conflict tree and per-entity actions.
- **ConflictResolutionTree** — Tree built from `DBEntityDependencies`; renderers per node type from registered items.
- **ATS_ConflictResolution** — App tools screen entry for conflict resolution.
- **dispatch_ShowConflictResolution** — Dispatcher to show the UI with given dependencies.

## API overview

- Module: init, show, register (see above).
- UI: Overlay and Panel are class components; Tree uses adapters and renderer map from shared types.
- Dispatcher: `dispatch_ShowConflictResolution.dispatchUI(dependencies)`.

## Dependencies

- `@nu-art/conflict-resolution-shared` — ConflictResolutionItem, types.
- `@nu-art/thunderstorm-frontend` — ModuleFE_BaseDB, ComponentSync, XHR, Adapter, TS_Tree, etc.
- `@nu-art/thunderstorm-shared` — DBEntityDependencies, DBEntityDependencyErrorType.
- `@nu-art/ts-common`, `@nu-art/ts-styles`, `react`.

## Examples

Wire module and init (in app frontend):

```ts
import { ModuleFE_ConflictResolution } from '@nu-art/conflict-resolution-frontend';

// In module pack
ModuleFE_ConflictResolution.initDefaultHasDependencyResponse();
// Register items for each entity type that can appear in conflicts
ModuleFE_ConflictResolution.registerConflictResolutionItem([...]);
```

Mount overlay in layout and add ATS screen to app tools list (import from package exports).
