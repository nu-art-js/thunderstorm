# @nu-art/rate-limit-backend

Backend rate limiting for Thunderstorm: per (policy, subject) sliding-window counters in the Realtime Database (this module's state, `/state/RateLimit/buckets/<bucketId>`), updated in RTDB transactions, with an http API middleware that answers 429.

## Exports

- `ModuleBE_RateLimit`: `consume(policy, subject)`, `hit(policy, subject)`, `middleware(policy, resolveSubject)`, `purgeExpired()`, `resolvePolicy(policy)`
- `deriveRateLimitBucketId(pepper, policyKey, subject)`: keyed bucket id (64 hex chars), never contains the subject
- `ModulePackBE_RateLimit`

## Config (`ModuleBE_RateLimit`)

| Field | Default | Meaning |
|---|---|---|
| `pepperSecretName` | `rate-limit--pepper` | Secret Manager secret (JSON string) used as the HMAC key for bucket ids |
| `policies` | `{}` | Per policy key overrides of `windowMs` / `limit` |
| `rejectMessage` | `Too many requests. Please try again later.` | User message of the 429 |

See `rate-limit/.rules/how-to-use.mdc` for setup and usage.
