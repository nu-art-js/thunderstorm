# @nu-art/rate-limit-shared

Sliding-window rate-limit contract for Thunderstorm: policy types, the pure decision function and the stored bucket shape.

## Exports

- `RateLimitPolicy`, `RateLimitPolicyOverride`, `RateLimitDecision`, `RateLimitBucket`
- `decideRateLimit(hits, policy, now)`: pure sliding-window decision. Refused hits are not recorded.
- `resolveRateLimitPolicy(policy, override)`, `assertRateLimitPolicy(policy)`

See `rate-limit/.rules/how-to-use.mdc` for setup and usage.
