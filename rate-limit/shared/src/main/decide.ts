/*
 * @nu-art/rate-limit-shared - Sliding-window rate-limit policies, decision logic and bucket entity contract
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {BadImplementationException} from '@nu-art/ts-common';
import type {RateLimitDecision, RateLimitPolicy, RateLimitPolicyOverride} from './types.js';

/**
 * Throws when a policy cannot limit anything meaningfully: `limit` must be a positive integer
 * and `windowMs` a positive finite number.
 */
export function assertRateLimitPolicy(policy: RateLimitPolicy): void {
	if (!policy.key)
		throw new BadImplementationException('Rate limit policy must have a key');

	if (!Number.isInteger(policy.limit) || policy.limit < 1)
		throw new BadImplementationException(`Rate limit policy '${policy.key}' has invalid limit: ${policy.limit}`);

	if (!Number.isFinite(policy.windowMs) || policy.windowMs <= 0)
		throw new BadImplementationException(`Rate limit policy '${policy.key}' has invalid windowMs: ${policy.windowMs}`);
}

/**
 * Applies a config override to a code-defined policy. The key never changes; the result is validated.
 */
export function resolveRateLimitPolicy(policy: RateLimitPolicy, override?: RateLimitPolicyOverride): RateLimitPolicy {
	const resolved: RateLimitPolicy = {
		key: policy.key,
		windowMs: override?.windowMs ?? policy.windowMs,
		limit: override?.limit ?? policy.limit,
	};
	assertRateLimitPolicy(resolved);
	return resolved;
}

/**
 * Sliding-window decision. Hits strictly newer than `now - windowMs` count; the hit is refused once
 * `limit` of them are already counted. Refused hits are never recorded, so a flood does not extend the block.
 *
 * Pure and stateless: the caller loads `hits` and persists the `allow` result atomically.
 */
export function decideRateLimit(hits: readonly number[], policy: Pick<RateLimitPolicy, 'windowMs' | 'limit'>, now: number): RateLimitDecision {
	const cutoff = now - policy.windowMs;
	const recent = hits.filter(hit => Number.isFinite(hit) && hit > cutoff).sort((a, b) => a - b);
	if (recent.length >= policy.limit) {
		const oldestCounted = recent[recent.length - policy.limit];
		return {action: 'reject', retryAfterMs: Math.max(1, oldestCounted + policy.windowMs - now)};
	}

	return {action: 'allow', hits: [...recent, now], expiresAt: now + policy.windowMs};
}
