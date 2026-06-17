# 2026-06-17 22:40 — Create @nu-art/thunder-theme + @nu-art/thunder-theme-editor packages
- **Author:** tacb0ss
- **Packages touched:** _thunderstorm/theme (new), _thunderstorm/theme-editor (new), _thunderstorm/widgets (doc ref)
- **Concepts / docs:** ModuleFE_Theme, ModulePackFE_Theme, ComponentGallery, token-introspection, design-language gallery

## Why

The theming **capability** (runtime theme registry + live design-token overrides) and the **theme editor** (design-language gallery + token editor) were living in the app layer (`@app/ui-foundation-frontend` in beamz). That made them per-product code, even though both are entirely generic: `ModuleFE_Theme` only needs `ts-common`, and the gallery only previews `thunder-widgets` components and reads the `:root` token contract from the CSSOM (now shipped by `thunder-widgets/theme.scss`). Generic framework capability belongs in the framework so every Thunderstorm project gets it without re-implementing — the same reasoning that moved the token contract + component SCSS into `thunder-widgets`. This is the capability/editor half of that migration.

Split into two packages (not one) to keep the dependency direction clean: the editor depends on the capability, never the reverse. A product can ship `thunder-theme` (the runtime switcher + override engine) without pulling in the whole gallery UI; the editor is opt-in.

## What changed

- **`@nu-art/thunder-theme`** (`_thunderstorm/theme`): `ModuleFE_Theme` (moved verbatim from ui-foundation) + `ModulePackFE_Theme` + `index.ts`. Dep: `@nu-art/ts-common` only.
- **`@nu-art/thunder-theme-editor`** (`_thunderstorm/theme-editor`): the entire `gallery/**` tree (ComponentGallery, modes, grids, previews, registry, theme-editor/TokenEditor+TokenRow+token-introspection). The 7 files that imported `ModuleFE_Theme` via a relative `../modules/...` path now import `@nu-art/thunder-theme`. Deps: `thunder-theme`, `thunder-widgets`, `thunder-routing`, `ts-styles`, `react`, `react-dom`.
- Both follow the Thunderstorm package standard (`__package.json` with `unitConfig: typescript-lib`, LICENSE, `.gitignore`, `src/main`, root `index.js`/`index.d.ts` export).
- Updated stale `@app/styles-components` / `@app/ui-foundation-frontend` references in `ModuleFE_Theme` and `widgets/component-guides/tree/how-to.md`.

## Verified

`bai -i` (full relink + build) completed successfully — both new packages compiled and the apps built against them (admin CSS 126.6 kB, portal 83.8 kB). No linter errors on the moved sources.
