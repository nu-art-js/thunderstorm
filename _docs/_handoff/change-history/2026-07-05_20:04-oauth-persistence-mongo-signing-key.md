# 2026-07-05 20:04 — OAuth state persistence in Mongo
- **Author:** tacb0ss
- **Packages touched:** @nu-art/oauth-shared, @nu-art/oauth-backend
- **Concepts / docs:** OAuth signing key, OAuth client/grant/token DB modules

## Why

Backend restarts (watch mode on every edit) invalidated Cursor's LOCAL_SERVER MCP session end-to-end: `ModuleBE_OAuthServer` regenerated its RS256 signing keypair with a new random `kid` on every boot, so previously issued JWTs failed verification (401 → full re-auth). OAuth clients, grants, and refresh tokens lived in in-memory Maps and were lost on restart. Persisting the signing key and OAuth state in Mongo lets access tokens stay verifiable and refresh tokens survive restarts — MCP session re-init on 404 then succeeds without re-auth. **Production should later move the private signing key to a secret manager**; Mongo persistence is the local/dev bootstrap path.

## What changed

- New shared entity `oauth-signing-key` (`DBDef_OAuthSigningKey`, unique on `kid`).
- Four new backend DB modules: `ModuleBE_OAuthSigningKeyDB`, `ModuleBE_OAuthClientDB`, `ModuleBE_OAuthGrantDB`, `ModuleBE_OAuthTokenDB`; registered in `ModulePackBE_OAuth` before `ModuleBE_OAuthServer`.
- `ModuleBE_OAuthServer`: load-or-create signing key via Mongo (with `keysReady` promise awaited by token/JWKS paths); all client/grant/token Maps replaced with DB module calls; boot-time key load uses `MemStorage.init` + `unManipulatedQuery`.

## Verified

- `bai -up="oauth-shared|oauth-backend|mcp-backend|beamz-backend"` — success
- `bai -t -nb -tt=pure -up=oauth-backend` — 14 passing
- Boot log (`beamz-dev/backend.log`): first post-fix boot `Generated and persisted new OAuth signing key (kid: 93812aa7-1e07-4131-a339-6ecb2a2b5396)`; two subsequent restarts both `Loaded persisted OAuth signing key (kid: 93812aa7-1e07-4131-a339-6ecb2a2b5396)`
