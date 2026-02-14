# TS_CollapsableContainer — DEPRECATED

**This component is deprecated.** Use **TS_CollapsableContainerV2** instead.

## Why migrate?

- V2 uses `ResolvableContent` and shared layout/icons; consistent with the rest of the widgets package.
- V2 supports optional CSS-based expand/collapse animation via `animated`.
- V1’s manual max-height logic is replaced by simpler layout in V2.

## How to migrate to V2

1. **Switch import and component name**
   - From: `TS_CollapsableContainer`
   - To: `TS_CollapsableContainerV2` (same package export).

2. **Props that stay the same**
   - `headerRenderer`, `containerRenderer` — same usage (node or function returning node).
   - `collapsed`, `initialCollapsed`, `onCollapseToggle` — controlled/uncontrolled unchanged.
   - `className`, `style`, `id`, `onHeaderRightClick`, `innerRef` — unchanged.

3. **Props removed in V2**
   - `showCaret` — V2 always shows a caret; use `customCaret` to replace or customize.
   - `flipHeaderOrder` — not supported; use CSS or a wrapper to change order.
   - `maxHeight` — not supported; use `style` or `className` on the wrapper if you need height limits.
   - `onMouseEnter`, `onMouseLeave`, `onMouseOver` — not supported; wrap in a `div` and attach handlers there.

4. **New in V2**
   - `animated?: boolean` — enables CSS transition for expand/collapse.
   - `forceUpdate?: boolean` — forces re-render when parent updates (e.g. when inner content depends on parent props).

5. **Styling**
   - V2 uses BEM-style classes under `ts-collapsable-container-v2__*`. Adjust your CSS selectors or overrides if you targeted the old class names.
