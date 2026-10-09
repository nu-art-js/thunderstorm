/*
 * @nu-art/rate-limit-shared - Sliding-window rate-limit policies, decision logic and bucket entity contract
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

/**
 * A named sliding-window limit: at most `limit` accepted hits per `windowMs` for one subject.
 *
 * The `key` is stable and domain-agnostic (e.g. `'auth.login.ip'`). It is part of the bucket identity
 * and the path under which module config may override `windowMs` / `limit`.
 */
export type RateLimitPolicy = {
	key: string;
	windowMs: number;
	limit: number;
};

/** Config-side override of a policy's numbers, keyed by policy key in the backend module config. */
export type RateLimitPolicyOverride = Partial<Pick<RateLimitPolicy, 'windowMs' | 'limit'>>;

/**
 * Outcome of one hit against a bucket.
 * - `allow`: the hit is recorded; `hits` is the new hit list and `expiresAt` the instant the bucket can be dropped.
 * - `reject`: nothing is recorded; `retryAfterMs` is when the oldest counted hit leaves the window.
 */
export type RateLimitDecision =
	| { action: 'allow'; hits: number[]; expiresAt: number }
	| { action: 'reject'; retryAfterMs: number };
