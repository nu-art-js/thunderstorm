# @nu-art/rate-limit-backend

Backend rate limiting for Thunderstorm: per (policy, subject) sliding-window counters stored in the `rate-limit--buckets` db-api entity, updated in a transaction, with an http API middleware that answers 429.

> Known limitation: until the `FirestoreWrapperBE.runTransaction` retry issue in `ISSUES.md` is fixed, concurrent hits for the same subject can exceed the limit.

## Exports

- `ModuleBE_RateLimit`: `consume(policy, subject)`, `hit(policy, subject)`, `middleware(policy, resolveSubject)`, `purgeExpired()`, `resolvePolicy(policy)`
- `ModuleBE_RateLimitBucketDB`: storage module (no CRUD API exposed)
- `deriveRateLimitBucketId(pepper, policyKey, subject)`: keyed bucket id, never contains the subject
- `ModulePackBE_RateLimit`

## Config (`ModuleBE_RateLimit`)

| Field | Default | Meaning |
|---|---|---|
| `pepperSecretName` | `rate-limit--pepper` | Secret Manager secret (JSON string) used as the HMAC key for bucket ids |
| `policies` | `{}` | Per policy key overrides of `windowMs` / `limit` |
| `rejectMessage` | `Too many requests. Please try again later.` | User message of the 429 |

See `rate-limit/.rules/how-to-use.mdc` for setup and usage.
