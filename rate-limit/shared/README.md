# @nu-art/rate-limit-shared

Sliding-window rate-limit contract for Thunderstorm: policy types, the pure decision function and the `rate-limit--buckets` entity definition.

## Exports

- `RateLimitPolicy`, `RateLimitPolicyOverride`, `RateLimitDecision`
- `decideRateLimit(hits, policy, now)`: pure sliding-window decision. Refused hits are not recorded.
- `resolveRateLimitPolicy(policy, override)`, `assertRateLimitPolicy(policy)`
- `DB_RateLimitBucket`, `DatabaseDef_RateLimitBucket`, `DBDef_RateLimitBucket`, `RateLimitBucket_DbKey`

See `rate-limit/.rules/how-to-use.mdc` for setup and usage.
