# 2026-07-17 03:25 — OAuth server app-concept eviction + binder registry
- **Author:** tacb0ss
- **Packages touched:** `@nu-art/oauth-{shared,backend}`
- **Concepts / docs:** opaque consent context, `registerContextBinder`, RFC 8707 resource matching

## Why

The generic OAuth authorization server had a specific consumer's product vocabulary ("sky") and a foreign domain's entities (org/unit/project) threaded through its config, control flow, entities, and API contract — infra depended on the app. Replaced with an opaque `context` blob + an app-registered `registerContextBinder(matcher, binder)` registry so the infra knows only OAuth primitives.

## What changed

- **`OAuthConsentContext`:** opaque `TS_Object`; removed org/unit/project typed shapes from shared.
- **`OAuthContextMintParams` / grant+token entities / `completeAuthorization` body:** `orgUnitId`/`projectId` → optional opaque `context`.
- **`OAuthContextBinder`:** three opaque calls (`resolveConsentRedirect`, `loadConsentContext`, `mintSessionJwt`); no app vocabulary in signatures.
- **`ModuleBE_OAuthServer`:** `contextBinders[]` + `registerContextBinder(matcher, binder)`; consent path resolves binder by resource matcher; removed `setContextBinder`, `isSkyResource`, `parseOrgFromResource`, `loadPendingSkyGrant`, and config keys `skyResourcePath`/`adminPortalBaseUrl`.

## Verified

- Compiles via beamz-dev watch after downstream binder relocation (see main-repo handoff `mcp-auth-binders-moved-into-mcp-module`).
