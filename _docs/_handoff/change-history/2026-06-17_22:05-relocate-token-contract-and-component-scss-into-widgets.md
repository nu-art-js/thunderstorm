# 2026-06-17 22:05 — Relocate the token contract + tokenized component SCSS into thunder-widgets
- **Author:** tacb0ss
- **Packages touched:** @nu-art/thunder-widgets
- **Concepts / docs:** design-language token contract, component styling, sass `pkg:` exports

## Why

The tokenized component classes and the `:root` token contract (the default "Semantic
tokens" theme) lived in an **app-level** package (`@app/styles-components` in the beamz
repo). That meant every Thunderstorm project had to re-create the same styling package to
get themeable widgets. Moving the contract + component styling **down into the widget
library itself** makes themeable, tokenized widgets a property of `thunder-widgets` — any
consuming project gets the default theme and component skins for free and only layers its
own `[data-theme]` overrides on top. This is step 1 of the larger theming restructure
(widgets own structure + default theme; a future `thunder-theme` / `thunder-theme-editor`
own theming capability + gallery).

Delivery channel (decided with the user): a single **ordered aggregator** (`styles.scss`)
that the consumer `@use`s — same mechanism as the old `styles-components/component.scss`
(token contract first, then classes in a fixed order so equal-specificity cross-component
overrides like json-viewer → tree stay deterministic). Because the aggregator is now the
single load channel, each widget's own `import './X.scss'` self-import was removed to avoid
loading the same rules twice (no duplicate CSS, no nondeterministic order).

## What changed

- **New `theme.scss`** — the full `:root` token contract (semantic `--color-*`, dimension,
  font, motion, and every `--ts-<component>--*` default) + `::selection`. The default theme.
- **New `styles.scss`** — ordered aggregator: `@use 'theme'` then each component scss in
  load order (button … tree, json-viewer).
- **Each component scss now carries its tokenized class** (`button/Button.scss`,
  `input/TS_Input.scss`, …): legacy hardcoded styling replaced with `var(--ts-*)` tokens.
  Behavioural mechanics preserved (Button loader/in-progress, Input number-spinner). New
  `icon-button/TS_IconButton.scss` (class-only chrome, no widget component).
- **Removed 28 redundant `import './*.scss'` self-imports** across all component versions
  (v1/v2/v3) — the aggregator owns class loading now.
- **`__package.json` exports**: added `"sass": "./styles.scss"` on `.`, plus `./theme`
  (theme.scss) and `./styles` (styles.scss) sass subpaths.

## Verified

`bai -up='@app/styles-components,@nu-art/thunder-widgets,@app/ui-foundation-frontend,@app/admin-frontend'`
builds clean. admin CSS 126.6 kB (≈ prior 124 kB — no duplication); built CSS contains the
`:root` contract and every class, with `.ts-progress-bar{` emitted exactly once.
