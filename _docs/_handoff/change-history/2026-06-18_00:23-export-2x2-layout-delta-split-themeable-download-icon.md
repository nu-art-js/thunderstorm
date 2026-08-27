# 2026-06-18 00:23 — Export 2×2 layout, delta split by layer, themeable download icon
- **Author:** tacb0ss
- **Packages touched:** _thunderstorm/theme-editor, _thunderstorm/ts-styles
- **Concepts / docs:** two-layer token model, TS_Icons, theme export

## Why

The export affordance edits two token layers (component→theme, theme→value), so a single "Delta" button conflated them — an agent fixing the wiring shouldn't be handed value overrides and vice versa. The export now mirrors the model as a 2×2: **columns = Components (L1) / Theme (L2)**, **rows = full / delta**. Each cell is a focused, theme-filtered payload.

The download icon used `@nu-art/ts-styles` `icon__download.svg`, which had **no `fill`** → it defaulted to black and ignored theme color, rendering near-invisible on dark themes for *every* consumer (the package's other editor icons use `stroke="currentColor"`). Replaced the shared glyph with a clean `currentColor` line-style download arrow (consistent with `undo`/`link`) — a strict fix, not just an editor tweak. User picked the glyph and chose to fix it in the shared package rather than fork a local copy (SSOT).

## What changed

- **`_thunderstorm/ts-styles/.../svgs/icon__download.svg`** — replaced the unfilled FontAwesome solid glyph with a 24-viewBox `stroke="currentColor"` line download icon. Now themeable everywhere.
- **`theme-export.ts`** — `buildDeltaExport` split into `buildDeltaComponentExport` (L1 `--ts-*` overrides) and `buildDeltaThemeExport` (L2 overrides + created globals); `ThemeExport` union + `themeExportSize` updated; added `isComponentToken` helper.
- **`TokenEditor.tsx` / `.scss`** — export section pinned far right (`margin-left:auto`), "Export" word removed, four icon+label buttons in a 2×2 grid (`Components`, `Theme`, `Delta Components`, `Delta Theme`), each with an explanatory tooltip. Uses `TS_Icons.download`.

## Verified

`bai -up='ts-styles|thunder-theme|admin-frontend'` — clean compile.
