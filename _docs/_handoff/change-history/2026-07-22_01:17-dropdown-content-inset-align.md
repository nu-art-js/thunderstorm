# 2026-07-22 01:17 — Dropdown content inset alignment
- **Author:** tacb0ss
- **Packages touched:** widgets
- **Concepts / docs:** TS_DropDown, theme tokens, TS_Tree

## Why

Closed/open dropdown text did not share a left edge: header used a tiny hardcoded inset (and filter input used input padding), while options inherited tree root indent. Fixed once in the dropdown theme so every consumer aligns.

## What changed

- `--ts-dropdown--content-padding-inline` / `--ts-dropdown--item-padding-block` on the widgets theme.
- `TS_DropDown.scss` applies the shared inset to header + list; zeros root tree children indent under the items panel.

## Verified

- Beamz consumer compile `bai -up=thunder-widgets,org-portal` green.
