/*
 * @nu-art/rate-limit-backend - Sliding-window rate limiting over the Realtime Database with an http 429 middleware
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {generateHex, type TypedMap} from '@nu-art/ts-common';
import {FIREBASE_DEFAULT_PROJECT_ID, ModuleBE_Firebase} from '@nu-art/firebase-backend';
import {JWT_Input, ModuleBE_Auth} from '@nu-art/google-services-backend';
import {deleteApp} from 'firebase-admin/app';
import type {RateLimitBucket} from '@nu-art/rate-limit-shared';
import {ModuleBE_RateLimit_Class} from '../../main/ModuleBE_RateLimit.js';

const database = 'demo-test';

/** ModuleBE_RateLimit with a fixed pepper, so tests do not need Secret Manager. */
export class TestRateLimit_Class
	extends ModuleBE_RateLimit_Class {

	protected async loadPepper(): Promise<string> {
		return 'test-pepper';
	}
}

export async function setupFirebaseEmulator(): Promise<void> {
	process.env.FUNCTIONS_EMULATOR = 'true';
	process.env.GCLOUD_PROJECT = database;
	ModuleBE_Auth.setDefaultConfig({
		auth: {
			[FIREBASE_DEFAULT_PROJECT_ID]: {
				project_id: generateHex(4),
				databaseURL: `http://localhost:8102/?ns=${database}`,
				isEmulator: true,
			} as JWT_Input,
		},
	});
}

/** The RTDB node holding all buckets of `module` (its module state). */
export function bucketsRef(module: ModuleBE_RateLimit_Class) {
	return ModuleBE_Firebase.createModuleStateFirebaseRef<TypedMap<RateLimitBucket>>(module, 'buckets');
}

export async function cleanupBuckets(module: ModuleBE_RateLimit_Class): Promise<void> {
	await bucketsRef(module).delete();
}

/** The RTDB client keeps a live connection that would keep mocha running after the last test; close it. */
export async function teardownFirebase(): Promise<void> {
	await deleteApp(ModuleBE_Firebase.createAdminSession().app);
}
