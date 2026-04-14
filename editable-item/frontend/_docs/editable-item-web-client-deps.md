# Editable-item: web-client dependency map

Quick reference for decoupling editable-item from `@nu-art/web-client`.  
**Current state:** editable-item has no `@nu-art/web-client` in package.json; it imports from it in source. Those imports must be switched to v2 packages or shallow implementations.

**Note:** The ATS demo UI (`_ats/`) and the test backend + test entity (previously under `src/test/`) now live in the **@nu-art/editable-item-e2e-tests** package (`_thunderstorm/to-review/thunderstorm-v2/editable-item-e2e/`). That package contains the test harness, ModuleBE_EditableTestDB, shared test types/db-def/api-def, and the ATS screen used to exercise the editable-item library.

---

## 1. Files and their web-client imports

| File | Symbols from web-client |
|------|-------------------------|
| **TS_EditableItemController.tsx** | `ComponentSync` |
| **TS_EditableItemControllerProto.tsx** | `ProtoComponent` |
| **DBItemDropDownMultiSelector.tsx** | `ComponentSync`, `GenericDropDown_DBPointer_Item` |
| **ItemEditor_DefaultList.tsx** | `Button`, `ComponentSync`, `Model_PopUp`, `ModuleFE_MouseInteractivity`, `mouseInteractivity_PopUp`, `VirtualizedList` |
| **Page_ItemsEditor.tsx** | `FrameLayout`, `LL_H_C`, `LL_H_T`, `LL_V_L`, `ModuleFE_BrowserHistoryV2`, `ModuleFE_MouseInteractivity`, `mouseInteractivity_PopUp`, `openContent`, `ProtoComponent`, `ProtoComponentDef`, `SuperProto`, `TS_ButtonLoader`, `TS_Route` |
| **editables.tsx** | Many: `BaseAppLevelProps_TS_GenericDropDownV3`, `BaseAppLevelProps_TS_InputV2`, `BaseAppLevelProps_TS_TextAreaV2`, `BasePartialProps_DropDown`, `ComponentProps_Error`, `GenericDropDown_DBPointer_Item`, `GenericDropDownV3`, `MandatoryProps_TS_DropDown`, `Props_Checkbox`, `resolveEditableError`, `ResolveEditableErrorParams`, `TemplatingProps_TS_Checkbox`, `TemplatingProps_TS_GenericDropDown`, `TemplatingProps_TS_GenericDropDown_DBPointer`, `TemplatingProps_TS_InputV2`, `TemplatingProps_TS_TextAreaV2`, `TS_Checkbox`, `TS_DropDown`, `TS_InputV2`, `TS_TextAreaV2` |

---

## 2. Where symbols live in v2 (or need to)

| Symbol | In v2? | Action |
|--------|--------|--------|
| **ComponentSync** | Yes | `@nu-art/thunder-widgets` |
| **FrameLayout** | Yes | `@nu-art/thunder-widgets` (Layouts / FrameLayout) |
| **LL_H_C, LL_H_T, LL_V_L** | Yes | `@nu-art/thunder-widgets` (Layouts) |
| **TS_ButtonLoader** | Yes | `@nu-art/thunder-widgets` |
| **TS_Route** | Yes | `@nu-art/thunder-routing` |
| **VirtualizedList** | Yes | `@nu-art/thunder-widgets` (TS_VirtualizedList) |
| **openContent** | Yes | `@nu-art/thunder-widgets` (mouse-interactivity) |
| **ModuleFE_MouseInteractivity**, **mouseInteractivity_PopUp** | Yes | `@nu-art/thunder-widgets` (mouse-interactivity) |
| **Button** | Yes | `@nu-art/thunder-widgets` (Button) |
| **Model_PopUp** | Yes | `@nu-art/thunder-widgets` (mouse-interactivity types) |
| **ProtoComponent**, **ProtoComponentDef**, **SuperProto** | No | Port to thunder-core or widgets, or shallow in editable-item |
| **ModuleFE_BrowserHistoryV2** | No | Shallow impl (e.g. StorageKey or key-value get/set for `selected`) |
| **GenericDropDown_DBPointer_Item** | No | In widgets or editable-item (type + component) |
| **editables.tsx block** (TS_InputV2, TS_DropDown, GenericDropDownV3, etc.) | Partly | Several exist in thunder-widgets; types/templating may need to move or be re-exported from widgets |

---

## 3. Suggested order of work

1. **Quick import switches (no new code)**  
   - **TS_EditableItemController.tsx:** `ComponentSync` → `@nu-art/thunder-widgets`.  
   - **DBItemDropDownMultiSelector.tsx:** `ComponentSync` → `@nu-art/thunder-widgets`; leave `GenericDropDown_DBPointer_Item` from web-client until (4).  
   - **ItemEditor_DefaultList.tsx:** `ComponentSync`, `VirtualizedList`, `Button`, `ModuleFE_MouseInteractivity`, `mouseInteractivity_PopUp` → `@nu-art/thunder-widgets`; `Model_PopUp` from mouse-interactivity types in widgets.  
   - **Page_ItemsEditor.tsx:** `FrameLayout`, `LL_H_T`, `LL_V_L`, `openContent`, `TS_ButtonLoader`, `TS_Route`, `ModuleFE_MouseInteractivity`, `mouseInteractivity_PopUp` → widgets/routing; keep `ProtoComponent`, `ProtoComponentDef`, `SuperProto`, `ModuleFE_BrowserHistoryV2` for now (or add placeholders).

2. **ProtoComponent / ProtoComponentDef / SuperProto**  
   - Locate in monolith; either port to `@nu-art/thunder-core` (or widgets) or add a shallow base in editable-item so `Page_ItemsEditor` and `TS_EditableItemControllerProto` extend it without web-client.

3. **ModuleFE_BrowserHistoryV2**  
   - Used only for `get('selected')` / `set('selected', value)` (per-module selected id). Shallow impl: e.g. a small module or helper using StorageKey/localStorage key `browser-history-v2--selected`, or injectable get/set so routing can own it later.

4. **GenericDropDown_DBPointer_Item**  
   - Type + usage in `DBItemDropDownMultiSelector` and `editables.tsx`. Either export from widgets (if present there) or define in editable-item and use a simple dropdown that fits the same contract.

5. **editables.tsx**  
   - Replace web-client import with imports from `@nu-art/thunder-widgets` (and thunder-core/routing as needed). Add or re-export any missing types (e.g. templating props, error props) in widgets or in editable-item.

---

## 4. Routing vs widgets for layouts

- **LL_H_C, LL_V_L, LL_H_T, FrameLayout** live under **widgets** (Layouts, FrameLayout).  
- Editable-item already depends on **thunder-routing** and **thunder-widgets**.  
- Use **@nu-art/thunder-widgets** for all of these; no need for routing to re-export layouts unless the rest of the app already does.

---

## 5. Next step

- Either **apply (1)** only and leave ProtoComponent / BrowserHistoryV2 / editables for a follow-up, or  
- **Do (1) + (2)** if you want editable-item to build without web-client (with a minimal ProtoComponent/ProtoComponentDef/SuperProto in thunder-core or editable-item).
