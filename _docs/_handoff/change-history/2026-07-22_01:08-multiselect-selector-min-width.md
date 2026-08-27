# 2026-07-22 01:08 — Multi-select selector min-width token
- **Author:** tacb0ss
- **Packages touched:** widgets, editable-item/frontend
- **Concepts / docs:** TS_MultiSelect, theme tokens, TS_DropDown

## Why

Closed multi-select adder triggers sized to placeholder text while the absolute open panel grew with item content — a visual mismatch on every `TS_MultiSelect_V2` surface. Deferred measuring open width into the trigger; shipped a theme token floor so closed state is usable.

## What changed

- `theme.scss`: `--ts-multi-select--selector-min-width: 160px`.
- `TS_MultiSelect.scss`: apply that min-width to `.ts-dropdown` / `.ts-multi-select__selector` inside `.ts-multi-select__list`.

## Verified

- Consumed and compiled from Beamz (`bai -up=thunder-widgets,editable-item,…`) — green.
