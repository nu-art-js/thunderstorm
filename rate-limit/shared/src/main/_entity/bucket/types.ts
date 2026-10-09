/*
 * @nu-art/rate-limit-shared - Sliding-window rate-limit policies, decision logic and bucket entity contract
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';

export const RateLimitBucket_DbKey = 'rate-limit--buckets';
type DBKey = typeof RateLimitBucket_DbKey;

type VersionTypes = { '1.0.0': DB_RateLimitBucket };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes>;
type UniqueKeys = '_id';
type GeneratedKeys = never;
type Dependencies = {};

/**
 * One sliding window for one (policy, subject) pair.
 *
 * The subject (an IP, an email, an account id…) is never stored: `_id` is derived from a keyed digest of
 * policy key + subject, so the collection holds no personal data in clear.
 */
export type DB_RateLimitBucket = DB_Object<DBKey> & {
	/** The policy key, kept in clear for operations (purge, inspection per policy). */
	policyKey: string;
	/** Accepted hit timestamps (ms) inside the current window, oldest first. At most `limit` entries. */
	hits: number[];
	/** Newest hit + window. After this instant the bucket is empty and may be deleted. */
	expiresAt: number;
	/**
	 * The same instant as `expiresAt`, as a Date (stored by Firestore as a Timestamp), for a Firestore TTL
	 * policy on collection `rate-limit--buckets`, field `expiresAtTtl`. Write-only: nothing reads it, and a
	 * read returns a Firestore Timestamp rather than a Date.
	 */
	expiresAtTtl: Date;
};

export type DatabaseDef_RateLimitBucket = DB_Prototype<DB_ProtoSeed<DB_RateLimitBucket, DBKey, GeneratedKeys, Versions, UniqueKeys, Dependencies>>;
export type UI_RateLimitBucket = DatabaseDef_RateLimitBucket['uiType'];
