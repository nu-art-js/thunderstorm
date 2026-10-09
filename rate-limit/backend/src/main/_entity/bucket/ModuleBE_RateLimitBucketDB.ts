/*
 * @nu-art/rate-limit-backend - Sliding-window rate limiting over db-api with an http 429 middleware
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {type DatabaseDef_RateLimitBucket, DBDef_RateLimitBucket} from '@nu-art/rate-limit-shared';

/**
 * Storage for rate-limit buckets. Internal to the rate-limit lib: no CRUD API is exposed for it.
 * Read and written only by {@link ModuleBE_RateLimit}, inside a transaction.
 */
export class ModuleBE_RateLimitBucketDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_RateLimitBucket> {

	constructor() {
		super(DBDef_RateLimitBucket);
	}
}

export const ModuleBE_RateLimitBucketDB = new ModuleBE_RateLimitBucketDB_Class();
