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
| **TextArea** | TS_TextArea in `TS_Input/` and `input/v1/`; TS_TextAreaV2 in `components/TS_V2_TextArea/` | Same as Input: `input/v1/` (TS_TextArea), `input/v2/` (TS_TextAreaV2), `input/v3/` (new) | **Medium** | Part of Input family per rule. TS_V2_TextArea is separate folder; consolidate into input/v2 and ensure TS_TextAreaV2 (and any templating types) stay exported. |
| **Checkbox** | `components/TS_Checkbox/` (TS_Checkbox, TS_CheckboxV2 in same folder) | `src/main/checkbox/v1/`, `checkbox/v2/`, `checkbox/v3/` | **Medium** | Single folder, two classes. Split into v1/v2, add v3. TS_CheckboxGroup depends on TS_Checkbox; keep export names. |
| **CollapsableContainer** | `components/TS_CollapsableContainer/`, `components/TS_CollapsableContainerV2/` | `src/main/collapsable-container/v1/`, `collapsable-container/v2/`, `collapsable-container/v3/` | **Medium** | Two folders. Used by ui-modules (TS_AppTools). Preserve TS_CollapsableContainer, TS_CollapsableContainerV2 and types. |

---

## 2. Single-version components (one concept folder each)

No v1/v2/v3 subfolders; one folder per component (or one folder per “concept” if we group related pieces). Only layout and export wiring change.

| Component / surface | Current location | Target (suggested) | Complexity | Notes |
|---------------------|------------------|--------------------|------------|--------|
| TS_ErrorBoundary | `components/TS_ErrorBoundary/` | `src/main/error-boundary/` | Low | Single component. Used by ui-modules. |
| TS_Table | `components/TS_Table/` | `src/main/table/` | Low | |
| TS_Tabs | `components/TS_Tabs/` | `src/main/tabs/` | Low | |
| TS_Dropdown | `components/TS_Dropdown/` | `src/main/dropdown/` | Low | |
| TS_Overlay | `components/TS_Overlay/` | `src/main/overlay/` | Low | |
| TS_Tree | `components/TS_Tree/` | `src/main/tree/` | Low | |
| TS_CheckboxGroup | `components/TS_CheckboxGroup/` | `src/main/checkbox-group/` | Low | Depends on TS_Checkbox; migrate after Checkbox. |
| TS_Loader | `components/TS_Loader/` | `src/main/loader/` | Low | |
| TS_Dialog | `components/TS_Dialog/` (multiple files) | `src/main/dialog/` | Low | TS_SimpleDialog, TS_SimpleDialogue, TS_DialogOverlay. ModuleFE_Dialog in component-modules. |
| Button | `components/Button/` | `src/main/button/` | Low | Used by editable-item. |
| TS_Toaster | `components/TS_Toaster/` | `src/main/toaster/` | Low | TS_Toast, TS_ToastOverlay. ModuleFE_Toaster. |
| TS_Printable | `components/TS_Printable/` | `src/main/printable/` | Low | |
| TS_DragAndDrop | `components/TS_DragAndDrop/` | `src/main/drag-and-drop/` | Low | |
| TS_MemoryMonitor | `components/TS_MemoryMonitor/` | `src/main/memory-monitor/` | Low | |
| TS_Link | `components/TS_Link/` | `src/main/link/` | Low | |
| TS_ButtonLoader | `components/TS_ButtonLoader/` | `src/main/button-loader/` | Low | Used by editable-item. |
| TS_Toggler | `components/TS_Toggler/` | `src/main/toggler/` | Low | |
| TS_Space | `components/TS_Space/` | `src/main/space/` | Low | |
| TS_Radio | `components/TS_Radio/` | `src/main/radio/` | Low | |
| TS_Notifications | `components/TS_Notifications/` | `src/main/notifications/` | Low | |
| TS_ComponentTransition | `components/TS_ComponentTransition/` | `src/main/component-transition/` | Low | |
| TS_Slider | `components/TS_Slider/` | `src/main/slider/` | Low | |
| TS_PropRenderer | `components/TS_PropRenderer/` | `src/main/prop-renderer/` | Low | Used by editable-item (core). |
| TS_Form | `components/TS_Form/` | `src/main/form-component/` or `form/` | Low | Avoid clash with existing `components/form/`. |
| TS_VirtualizedList | `components/TS_VirtualizedList/` | `src/main/virtualized-list/` | Low | Used by editable-item. |
| TS_ProgressBar | `components/TS_ProgressBar/` | `src/main/progress-bar/` | Low | |
| TS_Card | `components/TS_Card/` | `src/main/card/` | Low | |
| TS_ReadMore | `components/TS_ReadMore/` | `src/main/read-more/` | Low | |
| Show | `components/Show.js` | `src/main/show/` or keep flat | Low | Single file. |
| TS_ButtonGroup | `components/TS_ButtonGroup/` | `src/main/button-group/` | Low | Uses InferProps/InferState from core. |
| TS_Toggle | `components/TS_Toggle/` | `src/main/toggle/` | Low | |
| TS_JSONViewer | `components/TS_JSONViewer/` | `src/main/json-viewer/` | Low | |
| Label | `components/Label/` | `src/main/label/` | Low | |
| Video | `components/Video/` (Video, VideoDialog) | `src/main/video/` | Low | |
| Layouts | `components/Layouts/`, `FrameLayout/`, `RelativeLayout/` | `src/main/layouts/` (or keep Layouts barrel) | Low | Exports LL_H_C, LL_V_L, etc. Used by editable-item, ui-modules. |
| HeightBounder | `components/HeightBounder.js` | `src/main/height-bounder/` or keep | Low | Single file. |
| TS_MouseInteractivity | `components/TS_MouseInteractivity/` (base, TS_PopUp, TS_Tooltip) | `src/main/mouse-interactivity/` (component side) | Low | Shared with component-modules/mouse-interactivity. Used by editable-item (openContent, ModuleFE_MouseInteractivity, Model_PopUp). |
| TS_ListOrganizer | `components/TS_ListOrganizer/` | `src/main/list-organizer/` | Low | |
| TS_CopyToClipboard | `components/TS_CopyToClipboard/` | `src/main/copy-to-clipboard/` | Low | |
| form (types, Form) | `components/form/` | `src/main/form/` (types + Form) | Low | Keep distinct from TS_Form component folder. |
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
| mouse-interactivity (module) | `component-modules/mouse-interactivity/` | Keep; ensure re-exports align with TS_MouseInteractivity component | Low | editable-item uses ModuleFE_MouseInteractivity, mouseInteractivity_PopUp, openContent, Model_PopUp. |

---

## 4. Consumers and export contract

- **editable-item (frontend):** ComponentSync, InferProps, InferState, TS_PropRenderer, FrameLayout, LL_H_C, LL_V_L, TS_ButtonLoader, VirtualizedList, ModuleFE_MouseInteractivity, mouseInteractivity_PopUp, Button, Model_PopUp. Types: BaseAppLevelProps_TS_InputV2, TemplatingProps_TS_InputV2 (and similar for other inputs/editables).
- **ui-modules (TS_AppTools):** LL_H_C, LL_V_L, TS_ErrorBoundary, TS_CollapsableContainer.
- **editable-item e2e:** GenericDropDownV3, TemplatingProps_TS_GenericDropDown — confirm if these live in widgets or another package; if widgets, add to dropdown migration.

**Rule:** Public type and component names must remain available from the main entry and/or versioned entries; no import path changes for existing consumers.

---

## 5. Suggested migration order

1. **Input** (high) — consolidate duplicates, then add v3.
2. **TextArea** (medium) — treat as part of Input family; ensure TS_TextAreaV2 and types in input/v2.
3. **Checkbox** (medium) — split v1/v2, add v3.
4. **CollapsableContainer** (medium) — v1/v2/v3.
5. **Core** — resolve _core vs core; single source, stable exports.
6. **Remaining components** — in any order; prefer doing those with the most dependents (TS_PropRenderer, Layouts, Button, TS_ButtonLoader, TS_MouseInteractivity / mouse-interactivity module) earlier.

---

## 6. Out of scope / follow-up

- **Pages** (ThunderstormDefaultApp, AppPage, AppPageV2, OnPageTitleChanged) — not component migration; decide separately.
- **component-modules/temp/** — temporary or legacy; handle separately.
- **GenericDropDownV3** — confirm package and add to this map if in widgets.

This file should be updated as components are moved and as new dependencies or export requirements are discovered.
