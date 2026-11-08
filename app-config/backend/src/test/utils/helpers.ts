/*
 * @nu-art/app-config-backend - Firebase test helpers (no thunderstorm)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {generateHex} from '@nu-art/ts-common';
import {FIREBASE_DEFAULT_PROJECT_ID, FirebaseSession, ModuleBE_Firebase} from '@nu-art/firebase-backend';
import {JWT_Input, ModuleBE_Auth} from '@nu-art/google-services-backend';
import {ModuleBE_AppConfigDB} from '../../main/ModuleBE_AppConfigDB.js';

const database = 'demo-test';
/** Matches bai-config.json files.tests.firebase.mongoPort when BAI has not injected MONGODB_EMULATOR_HOST. */
const DEFAULT_MONGO_PORT = 27019;

function resolveMongoUrl(): string {
	const host = process.env.MONGODB_EMULATOR_HOST ?? `localhost:${DEFAULT_MONGO_PORT}`;
	return `mongodb://${host}`;
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
	// This suite does not start ModuleBE_Firebase. Its init is what registers the resolver.
	ModuleBE_Firebase.setDefaultConfig({
		mongo: {
			mongoUrl: resolveMongoUrl(),
			params: {
				directConnection: 'true',
				replicaSet: 'rs0',
			},
		},
	});
	FirebaseSession.setMongoUrlResolver(authKey => ModuleBE_Firebase.resolveMongoUrl(authKey));
	ModuleBE_AppConfigDB.init();
}

export async function cleanupAppConfigCollection(): Promise<void> {
	try {
		await ModuleBE_AppConfigDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	} finally {
		await ModuleBE_Firebase.__resetForTests();
	}
}
