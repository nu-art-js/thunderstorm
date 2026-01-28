/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 *
 * Helpers for Playwright tests: IDB cleanup, test API instances, fixtures.
 */

import {cleanIDBStorage} from '@nu-art/idb-frontend';
import {__setTestHttpClientFactory} from '../main/decorators/ClientApi.js';
import {TestBaseApi, TestBaseApiUpgrade, TestBaseApiValidation} from './unit/run-serialized-by-id/test-base-api.js';
import {
	createStubCrudApiDefShape,
	testItemBaseDBConfig,
	type DB_TestItem,
	type TestItemTypes,
	type UI_TestItem
} from './fixtures/index.js';

/**
 * Clears IndexedDB storage used by db-api tests.
 * Call in beforeEach() for test isolation.
 */
export async function cleanupDbApiIDB(): Promise<void> {
	await cleanIDBStorage();
}

// Re-export test helpers for Playwright tests
export {TestBaseApi, TestBaseApiUpgrade, TestBaseApiValidation};
export {__setTestHttpClientFactory};
export {testItemBaseDBConfig, createStubCrudApiDefShape};
export type {DB_TestItem, TestItemTypes, UI_TestItem};
