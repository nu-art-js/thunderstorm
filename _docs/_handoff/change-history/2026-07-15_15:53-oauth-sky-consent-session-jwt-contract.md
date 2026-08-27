# 2026-07-15 15:53 — OAuth sky consent: session-JWT access tokens + working-context binder contract
- **Author:** tacb0ss
- **Packages touched:** `@nu-art/oauth-{shared,backend,frontend}`
- **Concepts / docs:** OAuth authorization-code fork on resource, session JWT as `access_token`, human consent for working context, `OAuthContextBinder` interface

## Why

An MCP client authorizing against a Thunderstorm backend needs its tool calls to run under a **real** account/org/unit/project context — the same session → account → permissions → org → project chain the browser plane uses — without inventing MCP-specific claims or duplicating resolvers. The cleanest contract is: the OAuth `access_token` **is** a Thunderstorm session JWT. That forces two framework decisions a consuming project must be able to challenge:

1. **Who chooses the working context?** Not the machine. For a resource that is a per-tenant surface, the human must pick org-unit + project at **consent** time, so `/authorize` on such a resource cannot auto-grant — it must fork to a pending grant + consent round-trip. Other resources keep auto-grant.
2. **How does the server mint a context-scoped token without knowing the app's domain model?** Via an injected `OAuthContextBinder` — the oauth package owns the protocol; the app owns org/unit/project enumeration and session minting. The package never imports app entities.

Refresh must reproduce the same context, so the persisted token record carries the context selectors (`orgUnitId`, `projectId`, `tokenKind`) and re-mints through the same binder.

## What changed

- **`oauth-shared`:** new `oauth-consent-types.ts` — `OAuthContextBinder` (`loadConsentContext`, `mintSessionJwt`, `resolveConsentRedirect`) + `OAuthContextMintParams`, consent context option types. `api-def` adds `consentContext` (GET) and `completeAuthorization` (POST). Grant entity gains `sessionJwt`/`orgUnitId`/`projectId`/`userId`; token entity gains `orgUnitId`/`projectId`/`tokenKind` (+ validators).
- **`oauth-backend/ModuleBE_OAuthServer`:** `/authorize` forks on the RFC 8707 `resource` — a sky resource creates a pending grant and redirects to the binder-resolved consent URL; others auto-grant. Consent handlers enumerate context and mint on confirm via the injected binder. `/token` returns the stored session JWT as `access_token`; refresh re-mints from the persisted context selectors. Grant/token DB modules persist the new fields.
- **`oauth-frontend`:** new `ModuleFE_OAuth` API client for the consent endpoints; consent query-param exports.

## Contract notes for consuming projects

- The binder is the only seam that touches the app's domain model — keep app entity imports out of the oauth package.
- Session-JWT-as-access-token means the app's existing session middleware must accept the `Authorization: Bearer` form (see the companion 401-challenge-header handoff) and resolve org/project context for the MCP plane.
- `mintSessionJwt` runs in whatever server context the endpoint established — for consent-complete that is the authenticated user; the app binder must mint accordingly (no service-account elevation when a user session is already present).
