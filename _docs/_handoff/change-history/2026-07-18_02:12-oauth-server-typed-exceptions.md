# 2026-07-18 02:12 — OAuth server uses typed framework exceptions
- **Author:** tacb0ss
- **Packages touched:** auth/oauth/backend
- **Concepts / docs:** ModuleBE_OAuthServer error taxonomy

## Why

Raw `Error` throws from OAuth token/key paths bypass the framework exception taxonomy, so clients and logs cannot distinguish MUST-never / bad-implementation / missing-binder / unauthorized-revoked cases. Align those paths with existing Thunderstorm exception/HTTP types.

## What changed

- Symmetric key import → `MUSTNeverHappenException`
- Missing sessionJwt on grant → `BadImplementationException`
- Missing consent binder on refresh → `ImplementationMissingException`
- Revoked token → `HttpCodes._4XX.UNAUTHORIZED`
