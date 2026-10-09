/*
 * @nu-art/rate-limit-backend - Sliding-window rate limiting over the Realtime Database with an http 429 middleware
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {HttpCodes} from '@nu-art/api-types';
import {SecretKey} from '@nu-art/google-services-backend';
import {MemKey_HttpRawResponse, type ServerApi_Middleware} from '@nu-art/http-server';
import {ModuleBE_Firebase} from '@nu-art/firebase-backend';
import {
	decideRateLimit,
	type RateLimitBucket,
	type RateLimitDecision,
	type RateLimitPolicy,
	type RateLimitPolicyOverride,
	resolveRateLimitPolicy
} from '@nu-art/rate-limit-shared';
import {currentTimeMillis, ImplementationMissingException, Module, type TypedMap} from '@nu-art/ts-common';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {deriveRateLimitBucketId} from './bucket-id.js';

type Config = {
	/** Secret Manager secret holding the HMAC pepper (a JSON string) used to derive bucket ids. */
	pepperSecretName: string;
	/** Per policy key overrides of windowMs / limit (RTDB _config). Code defaults apply when absent. */
	policies: TypedMap<RateLimitPolicyOverride>;
	/** Message shown to the caller on 429. */
	rejectMessage: string;
};

/** Resolves the subject a policy counts against, from the current request context (IP, email, account id…). */
export type RateLimitSubjectResolver = () => string | Promise<string>;

/**
 * Sliding-window rate limiting shared by every instance of the backend.
 *
 * Policies are defined in code (`RateLimitPolicy`), their numbers may be overridden by module config.
 * Each (policy, subject) pair is one Realtime Database node under this module's state
 * (`/state/RateLimit/buckets/<bucketId>`), updated in an RTDB transaction, so concurrent instances cannot
 * both take the last slot.
 *
 * Use {@link consume} from a handler, or {@link middleware} with `HttpServer.addApiMiddleware` to guard ApiDefs.
 */
export class ModuleBE_RateLimit_Class
	extends Module<Config> {

	private pepper?: Promise<string>;

	constructor() {
		super();
		this.setDefaultConfig({
			pepperSecretName: 'rate-limit--pepper',
			policies: {},
			rejectMessage: 'Too many requests. Please try again later.',
		});
	}

	/** The effective policy: the code definition with this module's config override applied. */
	resolvePolicy(policy: RateLimitPolicy): RateLimitPolicy {
		return resolveRateLimitPolicy(policy, this.config.policies?.[policy.key]);
	}

	/**
	 * Records one hit for `subject` under `policy`, or throws 429 (TOO_MANY_REQUESTS) without recording it.
	 * When called inside an http request, sets the `Retry-After` header (seconds).
	 */
	async consume(policy: RateLimitPolicy, subject: string, now: number = currentTimeMillis()): Promise<void> {
		const decision = await this.hit(policy, subject, now);
		if (decision.action === 'allow')
			return;

		const retryAfterSeconds = Math.ceil(decision.retryAfterMs / 1000);
		if (MemStorage.getStore())
			MemKey_HttpRawResponse.peak()?.setHeader('Retry-After', String(retryAfterSeconds));

		this.logWarning(`Rate limit hit: policy '${policy.key}', retry after ${retryAfterSeconds}s`);
		throw HttpCodes._4XX.TOO_MANY_REQUESTS(this.config.rejectMessage, `Rate limit policy '${policy.key}' exceeded`);
	}

	/**
	 * Atomic read-decide-write of one bucket in a Realtime Database transaction. Returns the decision
	 * instead of throwing, for callers that want to degrade rather than refuse.
	 *
	 * A bucket whose window has passed is cleaned up when its key is touched: an allowed hit rewrites it
	 * with only the hits still inside the window. A rejected hit leaves the bucket unchanged.
	 */
	async hit(policy: RateLimitPolicy, subject: string, now: number = currentTimeMillis()): Promise<RateLimitDecision> {
		const resolved = this.resolvePolicy(policy);
		const bucketRef = this.bucketRef(deriveRateLimitBucketId(await this.getPepper(), resolved.key, subject));

		// The update function can run several times (first against the local cache, then against the server
		// value); the decision of the last run is the one that committed or aborted.
		let decision: RateLimitDecision | undefined;
		await bucketRef.transaction((current: RateLimitBucket | null) => {
			decision = decideRateLimit(current?.hits ?? [], resolved, now);
			// Reject: return the value unchanged rather than aborting. Aborting would accept a decision taken
			// on a possibly stale local cache; returning it makes the SDK compare with the server and rerun.
			if (decision.action === 'reject')
				return current as RateLimitBucket;

			return {policyKey: resolved.key, hits: decision.hits, expiresAt: decision.expiresAt};
		});

		if (!decision)
			throw new ImplementationMissingException('Rate limit transaction finished without a decision');

		return decision;
	}

	/**
	 * An http API middleware that consumes one hit per request. Register with
	 * `HttpServer.getDefault().addApiMiddleware(apiDef => apiDef === ApiDef_X.y, ModuleBE_RateLimit.middleware(policy, resolver))`.
	 */
	middleware(policy: RateLimitPolicy, resolveSubject: RateLimitSubjectResolver): ServerApi_Middleware {
		return async () => this.consume(policy, await resolveSubject());
	}

	/**
	 * Deletes buckets whose window has passed (periodic cleanup; touched keys clean themselves up in `hit`).
	 * Each delete is a transaction that re-checks expiry, so a bucket hit meanwhile is kept.
	 * Returns the number of deleted buckets.
	 */
	async purgeExpired(now: number = currentTimeMillis()): Promise<number> {
		const buckets = await this.bucketsRef().get({});
		let deleted = 0;
		for (const bucketId of Object.keys(buckets)) {
			if (!(buckets[bucketId].expiresAt <= now))
				continue;

			// The update function may first run against an empty local cache (null); returning null then is a
			// no-op that makes the SDK retry with the server value. Only the last run decides.
			let expired = false;
			const result = await this.bucketRef(bucketId).transaction((current: RateLimitBucket | null) => {
				expired = !!current && current.expiresAt <= now;
				return (expired ? null : current) as RateLimitBucket;
			});
			if (result.committed && expired)
				deleted++;
		}

		this.logInfo(`Purged ${deleted} expired rate limit buckets`);
		return deleted;
	}

	private bucketsRef() {
		return ModuleBE_Firebase.createModuleStateFirebaseRef<TypedMap<RateLimitBucket>>(this, 'buckets');
	}

	private bucketRef(bucketId: string) {
		return ModuleBE_Firebase.createModuleStateFirebaseRef<RateLimitBucket>(this, `buckets/${bucketId}`);
	}

	/** Loads the pepper once from Secret Manager. Fails loudly when the secret is missing or empty. */
	protected async loadPepper(): Promise<string> {
		const pepper = await new SecretKey<string>(this.config.pepperSecretName).get();
		if (!pepper)
			throw new ImplementationMissingException(`Missing rate limit pepper secret '${this.config.pepperSecretName}'`);

		return pepper;
	}

	private getPepper(): Promise<string> {
		if (!this.pepper)
			this.pepper = this.loadPepper().catch(err => {
				this.pepper = undefined;
				throw err;
			});

		return this.pepper;
	}
}

export const ModuleBE_RateLimit = new ModuleBE_RateLimit_Class();
