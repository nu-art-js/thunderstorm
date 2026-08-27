# 2026-07-15 15:54 — Session Authorization header: 401 challenge for machine planes (kept 403 for browser)
- **Author:** tacb0ss
- **Packages touched:** `@nu-art/user-account-backend`
- **Concepts / docs:** auth header status semantics, MCP OAuth bootstrap, session middleware

## Why

When a machine plane (e.g. MCP) runs the shared session chain, an **unauthenticated** request must answer **401 Unauthorized** — that is the challenge an OAuth/MCP client waits for before starting discovery. Thunderstorm's `Header_Authorization` historically defaulted to **403** (authenticated-but-forbidden), which the browser auth chain and the FE session-timeout handling deliberately depend on. A 403 does **not** trigger MCP discovery, so a client loops forever with no `Authorization` header. The status cannot be flipped globally without breaking the browser chain, so the two semantics must coexist as distinct header keys.

## What changed

- **`session/consts.ts`:** the 403-default key renamed to `Header_AuthorizationDeprecated403` (retained for the browser chain); new `Header_Authorization` defaults to **401** on a missing header (same case-insensitive `Bearer ` strip processor).
- **`ModuleBE_SessionDB`:** `Middleware` reads the deprecated-403 key (browser behavior unchanged); new `AuthChallengeMiddleware` asserts presence via the 401 key — registered by the app **before** the auth chain for machine-plane APIs so a missing header yields 401 pre-chain, and is a no-op when a Bearer session JWT is present.
- **`ModuleBE_AccountDB`:** logout migrated to the deprecated-403 key.

## Contract notes for consuming projects

- Browser APIs keep 403 on missing/invalid auth — do not migrate them to the 401 key.
- Any new machine-to-machine plane that expects OAuth bootstrap must register `AuthChallengeMiddleware` ahead of the session chain and keep its endpoints off `openApis` (so the chain resolves context from the Bearer session JWT).
