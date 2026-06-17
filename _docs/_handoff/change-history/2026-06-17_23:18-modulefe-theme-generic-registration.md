# 2026-06-17 23:18 — ModuleFE_Theme: generic theme registration (no hardcoded dark/light)
- **Author:** tacb0ss
- **Packages touched:** _thunderstorm/theme (@nu-art/thunder-theme)
- **Concepts / docs:** ModuleFE_Theme, ThemeDescriptor, setThemes; two-layer token model

## Why

`ModuleFE_Theme` is infra, but it hardcoded beamz vocabulary — `defaultThemes = [{dark},{light}]` and `defaultTheme = 'dark'` baked into the module and auto-registered in `init()`. That made the framework presume specific theme names. The corrected model (see memory `theme-two-layer-model-and-export-options`): a theme is a **named override set wired by the app**; the name is supplied **at registration**, and `dark`/`light` are ordinary registrations — a private case of the general one, not infra special-cases. The module must manage only what the app registers and presume no names.

This is the capability-side half of "themes and wiring"; the app-side registration lives in beamz (see that repo's change-history same date).

## What changed

- Removed hardcoded `defaultThemes`/`defaultTheme`. Added `setThemes(themes, initialTheme?)` — the app declares its theme set (each `ThemeDescriptor` carries its own name) + the initial selection during composition; `init()` registers them and resolves the active theme as `persisted → initialTheme → none`. With nothing registered, the module stays on the widget `:root` baseline (no `data-theme` attribute) instead of forcing `'dark'`.
- `TokenOverride.theme` is now optional — undefined means no theme was active, i.e. the override targets the base (`:root`) layer. `setOverride` tags overrides with `currentTheme` (was the removed `defaultTheme`).

## Verified

`bai -i` full relink + build green (both apps). No linter errors.
