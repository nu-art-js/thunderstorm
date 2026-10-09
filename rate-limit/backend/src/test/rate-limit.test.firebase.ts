/*
 * @nu-art/rate-limit-backend - Sliding-window rate limiting over the Realtime Database with an http 429 middleware
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {ApiException, isErrorOfType} from '@nu-art/ts-common';
import type {RateLimitPolicy} from '@nu-art/rate-limit-shared';
import {deriveRateLimitBucketId} from '../main/bucket-id.js';
import {bucketsRef, cleanupBuckets, setupFirebaseEmulator, teardownFirebase, TestRateLimit_Class} from './utils/helpers.js';

/** Fresh per test: setDefaultConfig merges, so a policy override would leak between tests. */
let RateLimit: TestRateLimit_Class;
const policy: RateLimitPolicy = {key: 'test.book.ip', windowMs: 60_000, limit: 3};
const t0 = 1_800_000_000_000;

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

const bucketOf = async (subject: string) => (await bucketsRef(RateLimit).get({}))[deriveRateLimitBucketId('test-pepper', policy.key, subject)];

describe('rate-limit - ModuleBE_RateLimit (realtime database emulator)', () => {
	before(async () => {
		await setupFirebaseEmulator();
	});

	after(async () => {
		await teardownFirebase();
	});

	beforeEach(async () => {
		RateLimit = new TestRateLimit_Class();
		await cleanupBuckets(RateLimit);
	});

	it('allows limit hits, then answers 429 without recording the refused hit', async () => {
		for (let i = 0; i < policy.limit; i++)
			await RateLimit.consume(policy, '203.0.113.7', t0 + i);

		await expect429(RateLimit.consume(policy, '203.0.113.7', t0 + 10));
		expect(await bucketOf('203.0.113.7')).to.deep.equal({policyKey: policy.key, hits: [t0, t0 + 1, t0 + 2], expiresAt: t0 + 2 + policy.windowMs});
	});

	it('never stores the subject in clear', async () => {
		await RateLimit.consume(policy, 'guest@example.com', t0);
		const all = await bucketsRef(RateLimit).get({});
		expect(Object.keys(all)).to.have.length(1);
		expect(JSON.stringify(all)).to.not.contain('guest@example.com');
	});

	it('counts subjects independently', async () => {
		for (let i = 0; i < policy.limit; i++)
			await RateLimit.consume(policy, 'subject-a', t0 + i);

		await RateLimit.consume(policy, 'subject-b', t0 + 5);
		await expect429(RateLimit.consume(policy, 'subject-a', t0 + 6));
	});

	it('slides: a hit is accepted again once the oldest counted hit leaves the window', async () => {
		for (let i = 0; i < policy.limit; i++)
			await RateLimit.consume(policy, 'slider', t0 + i * 1000);

		// The window is (now - windowMs, now]: the hit at t0 still counts at t0 + windowMs - 1 and is gone at t0 + windowMs.
		await expect429(RateLimit.consume(policy, 'slider', t0 + policy.windowMs - 1));
		await RateLimit.consume(policy, 'slider', t0 + policy.windowMs);
	});

	it('cleans up an expired window when its key is touched', async () => {
		for (let i = 0; i < policy.limit; i++)
			await RateLimit.consume(policy, 'returning', t0 + i);

		const later = t0 + 10 * policy.windowMs;
		await RateLimit.consume(policy, 'returning', later);
		expect(await bucketOf('returning')).to.deep.equal({policyKey: policy.key, hits: [later], expiresAt: later + policy.windowMs});
	});

	it('applies the config override for the policy key', async () => {
		RateLimit.setDefaultConfig({policies: {[policy.key]: {limit: 1}}});
		await RateLimit.consume(policy, 'override', t0);
		await expect429(RateLimit.consume(policy, 'override', t0 + 1));
	});

	it('hit() returns the decision instead of throwing', async () => {
		RateLimit.setDefaultConfig({policies: {[policy.key]: {limit: 1}}});
		expect((await RateLimit.hit(policy, 'soft', t0)).action).to.equal('allow');
		expect(await RateLimit.hit(policy, 'soft', t0 + 1)).to.deep.equal({action: 'reject', retryAfterMs: policy.windowMs - 1});
	});

	it('concurrent hits cannot exceed the limit', async () => {
		const results = await Promise.allSettled(Array.from({length: 6}, (_, i) => RateLimit.consume(policy, 'burst', t0 + i)));
		expect(results.filter(r => r.status === 'fulfilled')).to.have.length(policy.limit);
		expect(results.filter(r => r.status === 'rejected').every(r => isErrorOfType((r as PromiseRejectedResult).reason, ApiException)?.responseCode === 429)).to.equal(true);
		expect((await bucketOf('burst'))?.hits).to.have.length(policy.limit);
	});

	it('purgeExpired deletes only buckets whose window has passed', async () => {
		await RateLimit.consume(policy, 'old', t0);
		await RateLimit.consume(policy, 'fresh', t0 + policy.windowMs);
		const deleted = await RateLimit.purgeExpired(t0 + policy.windowMs + 1);
		expect(deleted).to.equal(1);
		const remaining = Object.values(await bucketsRef(RateLimit).get({}));
		expect(remaining).to.have.length(1);
		expect(remaining[0].expiresAt).to.equal(t0 + 2 * policy.windowMs);
	});
});
