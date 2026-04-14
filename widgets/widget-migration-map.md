# Widget migration map — components and migration complexity

This file maps every component (and related surface) in `@nu-art/thunder-widgets` that is in scope for the reorganization defined in [widget-reorganization.mdc](widget-reorganization.mdc). For each item we list current location, target concept/layout, migration complexity, and notes.

**Complexity levels:**

- **High** — Multiple versions + duplicate or scattered locations + new v3 function component + many consumers or types to preserve.
- **Medium** — Two versions (v1/v2) to consolidate into concept/v1 and concept/v2, plus new v3; or single component with non-trivial deps.
- **Low** — Single implementation; move into one concept folder and wire exports; no v3 required by rule (optional).

**Execution order (from rule):** One component at a time; versioned components first (Input → TextArea → Checkbox → CollapsableContainer), then the rest as needed.

---

## 1. Versioned components (concept folder with v1 / v2 / v3)

These get a top-level concept folder under `src/main/<concept>/` with `v1/`, `v2/`, and `v3/` (v3 = new function component, same API where possible).

| Component family | Current location(s) | Target | Complexity | Notes |
|------------------|---------------------|--------|------------|--------|
| **Input** | `components/TS_Input/` (TS_Input, TS_BaseInput, TS_TextArea), `components/TS_V2_Input/` (TS_InputV2), `input/v1/` (copy of v1), `input/` (TS_Input, TS_BaseInput, TS_TextArea, TS_InputV2, v2.ts) | `src/main/input/v1/`, `input/v2/`, `input/v3/` | **High** | Duplicate v1 in both `components/TS_Input/` and `input/v1/`; v2 in `components/TS_V2_Input/` and `input/`. Must consolidate, preserve all export names (TS_Input, TS_InputV2, BaseAppLevelProps_TS_InputV2, TemplatingProps_TS_InputV2). Critical for editable-item. |
| **TextArea** | ~~TS_TextAreaV2 in `components/TS_V2_TextArea/`~~ → `textarea/v2/` | `textarea/v1/` (TS_TextArea), `textarea/v2/` (TS_TextAreaV2, TS_BaseInput, types) | **Medium** | Done. TS_TextAreaV2 + TS_BaseInput in textarea/v2; types (BaseAppLevelProps_TS_TextAreaV2, TemplatingProps_TS_TextAreaV2, etc.) exported. v1 entry keeps textarea/v1 only; default and v2/v3 export textarea/v2. |
| **Checkbox** | ~~`components/TS_Checkbox/`~~ → `checkbox/v1/`, `checkbox/v2/`, `checkbox/v3/` | `src/main/checkbox/v1/`, `checkbox/v2/`, `checkbox/v3/` | **Medium** | Done. v1: TS_Checkbox; v2: TS_CheckboxV2 (class); v3: function component exported as TS_CheckboxV2. TS_CheckboxGroup imports from `checkbox/v1`. Playwright: `checkbox.test.playwright.ts`. |
| **CollapsableContainer** | ~~`components/TS_CollapsableContainer/`, `components/TS_CollapsableContainerV2/`~~ → `collapsable-container/v1/`, `v2/`, `v3/` | `src/main/collapsable-container/v1/`, `v2/`, `v3/` | **Medium** | Done. v1: TS_CollapsableContainer (deprecated); v2: TS_CollapsableContainerV2 (class); v3: function component exported as TS_CollapsableContainerV2. Playwright: collapsable-container.test.playwright.ts. |

---

## 2. Single-version components (one concept folder each)

No v1/v2/v3 subfolders; one folder per component (or one folder per “concept” if we group related pieces). Only layout and export wiring change.

| Component / surface | Current location | Target (suggested) | Complexity | Notes |
|---------------------|------------------|--------------------|------------|--------|
| TS_ErrorBoundary | ~~`components/TS_ErrorBoundary/`~~ | `src/main/error-boundary/` | Low | Done. Single component. Used by dialog, ui-modules. |
| TS_Table | `components/TS_Table/` | `src/main/table/` | Low | |
| TS_Tabs | `components/TS_Tabs/` | `src/main/tabs/` | Low | |
| TS_Dropdown | `components/TS_Dropdown/` | `src/main/dropdown/` | Low | |
| TS_Overlay | `components/TS_Overlay/` | `src/main/overlay/` | Low | |
| TS_Tree | `components/TS_Tree/` | `src/main/tree/` | Low | |
| TS_CheckboxGroup | ~~`components/TS_CheckboxGroup/`~~ → `checkbox-group/` | `src/main/checkbox-group/` | Low | Done. Depends on checkbox/v1. |
| TS_Loader | `components/TS_Loader/` | `src/main/loader/` | Low | |
| TS_Dialog | ~~`components/TS_Dialog/`~~ | `src/main/component-modules/dialog/` | Low | Done. ModuleFE_Dialog + TS_Dialog, TS_DialogOverlay, TS_SimpleDialog, TS_SimpleDialogue in one folder. |
| Button | ~~`components/Button/`~~ → `button/` | `src/main/button/` | Low | Done. Button + ThreeDotsLoader (ex–TS_ButtonLoader) in same concept; TS_ButtonLoader exported as alias for backward compat. |
| TS_Toaster | `components/TS_Toaster/` | `src/main/toaster/` | Low | TS_Toast, TS_ToastOverlay. ModuleFE_Toaster. |
| TS_Printable | ~~`components/TS_Printable/`~~ → `printable/` | `src/main/printable/` | Low | Done. |
| TS_DragAndDrop | `components/TS_DragAndDrop/` | `src/main/drag-and-drop/` | Low | |
| TS_MemoryMonitor | `components/TS_MemoryMonitor/` | `src/main/memory-monitor/` | Low | |
| TS_Link | ~~`components/TS_Link/`~~ → `link/` | `src/main/link/` | Low | Done. |
| ~~TS_ButtonLoader~~ | Moved into `button/` as **ThreeDotsLoader** | — | — | Exported as TS_ButtonLoader from button/ for backward compat. |
| TS_Toggler | `components/TS_Toggler/` | `src/main/toggler/` | Low | |
| ~~TS_Space~~ | Removed | — | — | No longer in package. |
| TS_Radio | `components/TS_Radio/` | `src/main/radio/` | Low | |
| TS_Notifications | `components/TS_Notifications/` | `src/main/notifications/` | Low | |
| TS_ComponentTransition | `components/TS_ComponentTransition/` | `src/main/component-transition/` | Low | |
| TS_Slider | `components/TS_Slider/` | `src/main/slider/` | Low | |
| TS_PropRenderer | `components/TS_PropRenderer/` | `src/main/prop-renderer/` | Low | Used by editable-item (core). |
| TS_Form | ~~`components/TS_Form/`~~ | **Moved to @nu-art/thunder-form** | — | Dedicated form package; uses editable-item. Import from `@nu-art/thunder-form`. |
| TS_VirtualizedList | `components/TS_VirtualizedList/` | `src/main/virtualized-list/` | Low | Used by editable-item. |
| TS_ProgressBar | ~~`components/TS_ProgressBar/`~~ | `src/main/loaders/` | Low | Done. Lives with TS_CircularLoader, ThreeDotsLoader. |
| ~~TS_Card~~ | Removed | — | — | No longer in package. |
| TS_ReadMore | `components/TS_ReadMore/` | `src/main/read-more/` | Low | |
| Show | `components/Show.js` | `src/main/show/` or keep flat | Low | Single file. |
| TS_ButtonGroup | `components/TS_ButtonGroup/` | `src/main/button-group/` | Low | Uses InferProps/InferState from core. |
| TS_Toggle | `components/TS_Toggle/` | `src/main/toggle/` | Low | |
| TS_JSONViewer | `components/TS_JSONViewer/` | `src/main/json-viewer/` | Low | |
| Label | ~~`components/Label/`~~ → `label/` | `src/main/label/` | Low | Done. TS_Radio imports from label. |
| Video | ~~`components/Video/`~~ | `src/main/video/` | Low | Done. TS_Video, TS_VideoDialog, types. |
| Layouts | ~~`components/Layouts/`~~ → `layouts/` | `src/main/layouts/` | Low | Done. Linear layouts only (Grid, LL_*). FrameLayout and RelativeLayout removed; if needed, a dedicated package (e.g. Android-inspired layouts) later. Used by editable-item, ui-modules. |
| HeightBounder | `components/HeightBounder.js` | `src/main/height-bounder/` or keep | Low | Single file. |
| TS_MouseInteractivity | ~~`components/TS_MouseInteractivity/`~~ | `src/main/mouse-interactivity/` | Low | Done. Module + components + utils in one folder (base, TS_PopUp, TS_Tooltip, ModuleFE, types, helper-functions). |
| TS_ListOrganizer | `components/TS_ListOrganizer/` | `src/main/list-organizer/` | Low | |
| TS_CopyToClipboard | `components/TS_CopyToClipboard/` | `src/main/copy-to-clipboard/` | Low | |
| form (types, Form) | ~~`components/form/`~~ | **Moved to @nu-art/thunder-form** | — | Form, Component_Form, types. Form V3 (Component_FormV3) in same package; use `@nu-art/thunder-form` or `@nu-art/thunder-form/v3`. |
| adapter | Adapter, BaseRenderer | `src/main/adapter/` | Low | |

---

## 3. Core and component-modules (not per-component concepts)

These are package infrastructure. Path/export names must stay so dependents keep working.

| Surface | Current location | Migration | Complexity | Notes |
|---------|------------------|-----------|------------|--------|
| component-types | `core/component-types.ts` (index uses `_core`) | Resolve _core vs core; keep single core folder and export InferProps, InferState, etc. | Low | editable-item, TS_Dialog, TS_ButtonGroup depend on InferProps/InferState. |
| ComponentAsync | `core/ComponentAsync.js` | Same core folder | Low | |
| ComponentBase | `core/ComponentBase.js` | Same core folder | Low | |
| ComponentSync | `core/ComponentSync.tsx` | Same core folder | Low | Critical for editable-item. |
| ModuleFE_Clipboard | `component-modules/ModuleFE_Clipboard.ts` | Keep under component-modules or move to a single “modules” concept | Low | |
| ModuleFE_Dialog | `component-modules/ModuleFE_Dialog.tsx` | Same | Low | |
| ModuleFE_Notifications | `component-modules/ModuleFE_Notifications.ts` | Same | Low | |
| ModuleFE_Toaster | `component-modules/ModuleFE_Toaster.tsx` | Same | Low | |
| mouse-interactivity (module) | ~~`component-modules/mouse-interactivity/`~~ | Merged into `src/main/mouse-interactivity/` | Low | Done. Same folder as components (see TS_MouseInteractivity). |

---

## 4. Consumers and export contract

- **editable-item (frontend):** ComponentSync, InferProps, InferState, TS_PropRenderer, LL_H_C, LL_V_L, TS_ButtonLoader, VirtualizedList, ModuleFE_MouseInteractivity, mouseInteractivity_PopUp, Button, Model_PopUp. (FrameLayout removed from widgets; use LL_* or a dedicated layout package if needed.) Types: BaseAppLevelProps_TS_InputV2, TemplatingProps_TS_InputV2 (and similar for other inputs/editables).
- **ui-modules (TS_AppTools):** LL_H_C, LL_V_L, TS_ErrorBoundary, TS_CollapsableContainer.
- **editable-item e2e:** GenericDropDownV3, TemplatingProps_TS_GenericDropDown — confirm if these live in widgets or another package; if widgets, add to dropdown migration.

**Rule:** Public type and component names must remain available from the main entry and/or versioned entries; no import path changes for existing consumers.

---

## 5. Suggested migration order

1. **Input** (high) — consolidate duplicates, then add v3. *(Done.)*
2. **TextArea** (medium) — treat as part of Input family; ensure TS_TextAreaV2 and types in input/v2. *(Done.)*
3. **Checkbox** (medium) — split v1/v2, add v3. *(Done.)*
4. **CollapsableContainer** (medium) — v1/v2/v3. *(Done.)*
5. **Single-version components** (section 2) — in any order; prefer those with the most dependents (TS_PropRenderer, Layouts, Button, TS_ButtonLoader, TS_MouseInteractivity, TS_ErrorBoundary, TS_VirtualizedList, etc.) earlier.
6. **Core** (section 3) — **last:** resolve _core vs core; single source, stable exports. Do after all component moves.

---

## 6. Out of scope / follow-up

- **Pages** (ThunderstormDefaultApp, AppPage, AppPageV2, OnPageTitleChanged) — not component migration; decide separately.
- **component-modules/temp/** — temporary or legacy; handle separately.
- **GenericDropDownV3** — confirm package and add to this map if in widgets.

This file should be updated as components are moved and as new dependencies or export requirements are discovered.
