/*
 * @nu-art/rate-limit-backend - Sliding-window rate limiting over db-api with an http 429 middleware
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Dispatcher, generateHex} from '@nu-art/ts-common';
import {FIREBASE_DEFAULT_PROJECT_ID} from '@nu-art/firebase-backend';
import {JWT_Input, ModuleBE_Auth} from '@nu-art/google-services-backend';
import {ModuleBE_RateLimitBucketDB} from '../../main/_entity/bucket/ModuleBE_RateLimitBucketDB.js';
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
	// No ModuleManager in this test: db-api deletes dispatch canDelete to all modules, and there are none to ask.
	Dispatcher.modulesResolver = () => [];
	ModuleBE_RateLimitBucketDB.init();
}

export async function cleanupBuckets(): Promise<void> {
	await ModuleBE_RateLimitBucketDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
}
