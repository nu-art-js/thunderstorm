# @nu-art/turnstile-backend

Fail-closed Cloudflare Turnstile verification. `ModuleBE_Turnstile` verifies tokens (`verify`, `check`) and provides an http API middleware; `ModuleBE_TurnstileSiteverify` is the external-API module that owns the siteverify `ApiDef` and its own `HttpClient`.

## Config (`ModuleBE_Turnstile`)

| Field | Default | Meaning |
|---|---|---|
| `secretKeySecretName` | `turnstile-secret-key` | Secret Manager secret (JSON string) with the Turnstile secret key |
| `allowedHostnames` | `[]` | Hostnames a token must have been solved on; empty accepts any |

See `turnstile/.rules/how-to-use.mdc`.
