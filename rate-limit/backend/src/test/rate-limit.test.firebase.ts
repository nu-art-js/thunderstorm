/*
 * @nu-art/rate-limit-backend - Sliding-window rate limiting over db-api with an http 429 middleware
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {ApiException, isErrorOfType} from '@nu-art/ts-common';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import type {RateLimitPolicy} from '@nu-art/rate-limit-shared';
import {ModuleBE_RateLimitBucketDB} from '../main/_entity/bucket/ModuleBE_RateLimitBucketDB.js';
import {deriveRateLimitBucketId} from '../main/bucket-id.js';
import {cleanupBuckets, setupFirebaseEmulator, TestRateLimit_Class} from './utils/helpers.js';

/** Fresh per test: setDefaultConfig merges, so a policy override would leak between tests. */
let RateLimit: TestRateLimit_Class;
const policy: RateLimitPolicy = {key: 'test.book.ip', windowMs: 60_000, limit: 3};
const t0 = 1_800_000_000_000;

/** db-api transactions need a MemStorage context; an http request provides one per call in production. */
function inContext(test: () => Promise<void>): () => Promise<void> {
	return () => new MemStorage().init(test);
}

async function expect429(action: Promise<unknown>): Promise<void> {
	try {
		await action;
	} catch (e: unknown) {
		const apiException = isErrorOfType(e, ApiException);
		expect(apiException?.responseCode).to.equal(429);
		return;
	}
	throw new Error('expected a 429 ApiException');
}

describe('rate-limit - ModuleBE_RateLimit (firestore emulator)', () => {
	before(async () => {
		await setupFirebaseEmulator();
	});

	beforeEach(async () => {
		RateLimit = new TestRateLimit_Class();
		await new MemStorage().init(cleanupBuckets);
	});

	it('allows limit hits, then answers 429 without recording the refused hit', inContext(async () => {
		for (let i = 0; i < policy.limit; i++)
			await RateLimit.consume(policy, '203.0.113.7', t0 + i);

		await expect429(RateLimit.consume(policy, '203.0.113.7', t0 + 10));
		const bucket = await ModuleBE_RateLimitBucketDB.query.uniqueUnmanipulated(deriveRateLimitBucketId('test-pepper', policy.key, '203.0.113.7'));
		expect(bucket?.hits).to.deep.equal([t0, t0 + 1, t0 + 2]);
		expect(bucket?.policyKey).to.equal(policy.key);
		expect(bucket?.expiresAt).to.equal(t0 + 2 + policy.windowMs);
		// Stored as a Firestore Timestamp, so a TTL policy can use it.
		const ttl = bucket?.expiresAtTtl as unknown as { toMillis(): number };
		expect(typeof ttl?.toMillis).to.equal('function');
		expect(ttl.toMillis()).to.equal(t0 + 2 + policy.windowMs);
	}));

	it('never stores the subject in clear', inContext(async () => {
		await RateLimit.consume(policy, 'guest@example.com', t0);
		const all = await ModuleBE_RateLimitBucketDB.query.custom({where: {policyKey: policy.key}});
		expect(all).to.have.length(1);
		expect(JSON.stringify(all[0])).to.not.contain('guest@example.com');
	}));

	it('counts subjects independently', inContext(async () => {
		for (let i = 0; i < policy.limit; i++)
			await RateLimit.consume(policy, 'subject-a', t0 + i);

		await RateLimit.consume(policy, 'subject-b', t0 + 5);
		await expect429(RateLimit.consume(policy, 'subject-a', t0 + 6));
	}));

	it('slides: a hit is accepted again once the oldest counted hit leaves the window', inContext(async () => {
		for (let i = 0; i < policy.limit; i++)
			await RateLimit.consume(policy, 'slider', t0 + i * 1000);

		// The window is (now - windowMs, now]: the hit at t0 still counts at t0 + windowMs - 1 and is gone at t0 + windowMs.
		await expect429(RateLimit.consume(policy, 'slider', t0 + policy.windowMs - 1));
		await RateLimit.consume(policy, 'slider', t0 + policy.windowMs);
	}));

	it('applies the config override for the policy key', inContext(async () => {
		RateLimit.setDefaultConfig({policies: {[policy.key]: {limit: 1}}});
		await RateLimit.consume(policy, 'override', t0);
		await expect429(RateLimit.consume(policy, 'override', t0 + 1));
	}));

	it('hit() returns the decision instead of throwing', inContext(async () => {
		RateLimit.setDefaultConfig({policies: {[policy.key]: {limit: 1}}});
		expect((await RateLimit.hit(policy, 'soft', t0)).action).to.equal('allow');
		expect(await RateLimit.hit(policy, 'soft', t0 + 1)).to.deep.equal({action: 'reject', retryAfterMs: policy.windowMs - 1});
	}));

	// Skipped: fails until FirestoreWrapperBE.runTransaction stops leaking state between retries (see ISSUES.md).
	it.skip('concurrent hits cannot exceed the limit', inContext(async () => {
		const results = await Promise.allSettled(Array.from({length: 6}, (_, i) => new MemStorage().init(() => RateLimit.consume(policy, 'burst', t0 + i))));
		expect(results.filter(r => r.status === 'fulfilled')).to.have.length(policy.limit);
		const bucket = await ModuleBE_RateLimitBucketDB.query.uniqueUnmanipulated(deriveRateLimitBucketId('test-pepper', policy.key, 'burst'));
		expect(bucket?.hits).to.have.length(policy.limit);
	}));

	it('purgeExpired deletes only buckets whose window has passed', inContext(async () => {
		await RateLimit.consume(policy, 'old', t0);
		await RateLimit.consume(policy, 'fresh', t0 + policy.windowMs);
		const deleted = await RateLimit.purgeExpired(t0 + policy.windowMs + 1);
		expect(deleted).to.equal(1);
		const remaining = await ModuleBE_RateLimitBucketDB.query.custom({where: {policyKey: policy.key}});
		expect(remaining).to.have.length(1);
		expect(remaining[0].expiresAt).to.equal(t0 + 2 * policy.windowMs);
	}));
});
