/*
 * @nu-art/app-config-backend - Firebase test helpers
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ModuleBE_APIs, ModuleBE_SyncManager} from '@nu-art/thunderstorm-backend';
import type {StormTestInput} from '../../../thunderstorm/backend/src/main/test/StormTest.js';
import {ModuleBE_AppConfigDB} from '../../main/ModuleBE_AppConfigDB.js';
import {ModuleBE_AppConfigAPI} from '../../main/ModuleBE_AppConfigAPI.js';

async function cleanupAppConfigCollection(): Promise<void> {
	await ModuleBE_AppConfigDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
}

export const DefaultStormTestConfig_AppConfig: StormTestInput = {
	modules: [
		ModuleBE_APIs,
		ModuleBE_SyncManager,
		ModuleBE_AppConfigDB,
		ModuleBE_AppConfigAPI,
	],
	config: {},
	before: async () => {
		await cleanupAppConfigCollection();
	},
	after: async () => {
		await cleanupAppConfigCollection();
	},
};
