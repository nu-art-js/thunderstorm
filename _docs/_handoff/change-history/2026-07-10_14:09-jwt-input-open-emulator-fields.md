# 2026-07-10 14:09 — Open JWT_Input for app-level emulator config fields
- **Author:** tacb0ss
- **Packages touched:** google-services/backend
- **Concepts / docs:** ModuleBE_Auth, firebase emulator tests

## Why

App firebase tests pass emulator-specific fields (`databaseURL`, `isEmulator`) into auth config alongside `JWTInput`. Infra cannot enumerate every extension higher layers or environments add; tightening the type blocked compilation without adding value. Required JWT fields stay enforced; only the unknown extension surface stays open.

## What changed

- `ModuleBE_Auth.ts` — `export type JWT_Input = JWTInput & { [key: string]: any }`
