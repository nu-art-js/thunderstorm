# 2026-07-05 21:26 — Routing module navigate helpers for MCP bridge

## What changed

- `ModuleFE_Routing`: `goToRouteByKey(routeKey, params?, hash?)`, `getRouteByPath(pathname)`, `navigateToUrl(url)`.
- Same-origin URL/path navigation resolves via `routesMapByPath` → `goToRoute`; unknown paths use `push()`; cross-origin uses `window.location.href`.

## Why

MCP UI automation must navigate through the routing module (route keys + registered paths), not raw history APIs — preserves SPA session, bridge WebSocket, and route param composition.
