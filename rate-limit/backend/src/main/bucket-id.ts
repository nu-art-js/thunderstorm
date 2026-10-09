/*
 * @nu-art/rate-limit-backend - Sliding-window rate limiting over the Realtime Database with an http 429 middleware
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {createHmac} from 'node:crypto';
import {BadImplementationException} from '@nu-art/ts-common';

/**
 * Bucket id for one (policy, subject) pair: hex HMAC-SHA256(pepper, JSON [policyKey, subject]), 64 chars and
 * safe as a Realtime Database key.
 * The JSON tuple keeps the two parts unambiguous (no separator collisions).
 *
 * The pepper is a server secret, so the stored id cannot be reversed by enumerating small subject spaces
 * such as IPv4 addresses. There is deliberately no unkeyed fallback.
 */
export function deriveRateLimitBucketId(pepper: string, policyKey: string, subject: string): string {
	if (!pepper)
		throw new BadImplementationException('Rate limit pepper is empty');

	if (!subject)
		throw new BadImplementationException(`Rate limit subject is empty for policy '${policyKey}'`);

	return createHmac('sha256', pepper).update(JSON.stringify([policyKey, subject])).digest('hex');
}
