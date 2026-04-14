/*
 * @nu-art/app-config-backend - Firebase test helpers (no thunderstorm)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {generateHex} from '@nu-art/ts-common';
import {FIREBASE_DEFAULT_PROJECT_ID} from '@nu-art/firebase-backend';
import {JWT_Input, ModuleBE_Auth} from '@nu-art/google-services-backend';
import {ModuleBE_AppConfigDB} from '../../main/ModuleBE_AppConfigDB.js';

const database = 'demo-test';

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
	ModuleBE_AppConfigDB.init();
}

export async function cleanupAppConfigCollection(): Promise<void> {
	await ModuleBE_AppConfigDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
}
