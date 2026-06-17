# 2026-06-17 23:46 — Theme editor layer exports + thunder-theme storage keys
- **Author:** tacb0ss
- **Packages touched:** _thunderstorm/theme, _thunderstorm/theme-editor
- **Concepts / docs:** ModuleFE_Theme, TokenOverride, two-layer token model, agent read-back construct

## Why

The agent read-back construct (`#dl-theme-overrides`) only ever carried the live override delta and conflated the two token layers the editor actually edits. To hand a theme to an agent you need to choose *what* to hand over: the full Layer-1 wiring (component token → theme token), the full Layer-2 values (theme token → value), or just the changes — and never the redundant rest, so the agent isn't overloaded. The editor now exports each layer on demand, always **filtered to the active theme**, because a value edited under `dark` must not leak into a `light` export.

Storage keys still carried the retired `ui-foundation--` prefix after the capability moved into `@nu-art/thunder-theme`. Identifiers are now prefixed by the layer that **owns** them, not the package the code happens to sit in:
- **Editor-authored dev state → `theme-editor--`**: overrides key, the live dump node, the export node, and gallery selection. These exist only because the editor authored them; naming them after the editor is correct even though the override store physically lives in `ModuleFE_Theme`.
- **Runtime module state → `thunder-theme--`**: the persisted *selected theme* and the injected per-theme `<style>` id. These work with no editor loaded, so naming them after the editor would invert the layer direction (`thunder-theme` sits below `thunder-theme-editor`).

The old agent dump id `#dl-theme-overrides` is renamed to `#theme-editor--dump` — the read-back selector is chosen by the agent at call time (not hardcoded in the MCP tool), so the rename is safe.

## What changed

- **`_thunderstorm/theme/src/main/ModuleFE_Theme.ts`**
  - Runtime keys: `ui-foundation--theme` → `thunder-theme--selected`; injected per-theme style id `ui-foundation-theme--<name>` → `thunder-theme--<name>`.
  - Editor keys/nodes: overrides `ui-foundation--token-overrides` → `theme-editor--overrides`; dump node `dl-theme-overrides` → `theme-editor--dump`; export node → `theme-editor--export`.
  - Extracted `writeJsonNode(id, data)` (shared by the live dump) and added `publishExport(data)` → writes a dedicated `#theme-editor--export` construct, so an on-demand snapshot is not clobbered by later live edits.
- **`_thunderstorm/theme-editor/.../token-introspection.ts`** — added `declaredTokenValueForTheme(token, theme)`: prefers a `[data-theme='<theme>']` declaration over `:root` (quote-normalised), so a theme's own L2 values win.
- **`_thunderstorm/theme-editor/.../theme-export.ts`** (new) — `buildComponentToThemeExport` (L1), `buildThemeToValueExport` (L2), `buildDeltaExport` (overrides for the active theme + created globals), `themeExportSize`, and `publishThemeExport` (resolves the active theme, publishes via the module).
- **`TokenEditor.tsx` / `.scss`** — three export buttons (`→ Theme (L1)`, `→ Values (L2)`, `Δ Changes`) in the theme-editor controls, with a transient "N · label → #thunder-theme--export" note.
- **`gallery-selection-storage.ts`** — `ui-foundation--dl-gallery-selection` → `theme-editor--gallery-selection` (doc reference in `agent-rules--ui-building/design-language-page.mdc` updated).

## Verified

`bai -up='thunder-theme|admin-frontend'` — clean compile of `@nu-art/thunder-theme`, `@nu-art/thunder-theme-editor`, `@app/admin-frontend`.
