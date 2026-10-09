/*
 * @nu-art/rate-limit-backend - Sliding-window rate limiting over db-api with an http 429 middleware
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {createHmac} from 'node:crypto';
import {hashToUniqueId} from '@nu-art/db-api-shared';
import {BadImplementationException} from '@nu-art/ts-common';
import {type DB_RateLimitBucket, RateLimitBucket_DbKey} from '@nu-art/rate-limit-shared';

/**
 * Bucket `_id` for one (policy, subject) pair: a db-api unique id over HMAC-SHA256(pepper, JSON [policyKey, subject]).
 * The JSON tuple keeps the two parts unambiguous (no separator collisions).
 *
 * The pepper is a server secret, so the stored id cannot be reversed by enumerating small subject spaces
 * such as IPv4 addresses. There is deliberately no unkeyed fallback.
 */
export function deriveRateLimitBucketId(pepper: string, policyKey: string, subject: string): DB_RateLimitBucket['_id'] {
	if (!pepper)
		throw new BadImplementationException('Rate limit pepper is empty');

	if (!subject)
		throw new BadImplementationException(`Rate limit subject is empty for policy '${policyKey}'`);

	const digest = createHmac('sha256', pepper).update(JSON.stringify([policyKey, subject])).digest('hex');
	return hashToUniqueId<typeof RateLimitBucket_DbKey>(digest);
}
