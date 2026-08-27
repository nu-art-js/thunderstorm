# 2026-07-13 11:45 — Routing navigate-if-unchanged guard
- **Type:** change-history
- **Domain:** routing / ModuleFE_Routing

## Why
Query-param mutations (`removeQueryParam`, etc.) always dispatched synthetic `popstate`, even when the resolved history URL was identical. Listeners such as `Page_Landing_Shell.__onLocationChanged` that mutate query params in response recursed until stack overflow.

## What changed
- Added `getCurrentLocationUrl`, `resolveLocationUrl`, and `navigateIfChanged` in `ModuleFE_Routing`.
- `goToRoute`, `push`, `replace`, and `updateQueryParams` now no-op (no `replaceState`/`pushState`, no synthetic `popstate`) when the resolved target URL matches the current location.
- Fixed `goToRoute` same-route guard: compares resolved relative URLs instead of `composeUrl` output vs `location.href`.
- `updateQueryParams` preserves `location.hash` when rewriting search.
