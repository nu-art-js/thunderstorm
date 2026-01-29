/*
 * @nu-art/db-api-frontend - Test entry point for Playwright
 * Exposes package exports to window for page.evaluate() — main/ + test-utils only (playwright-tests rule).
 */

import {ModuleFE_BaseApi, ModuleFE_BaseDB} from '../main/base/index.js';
import {HttpClient} from '@nu-art/http-client';
import {
	cleanupDbApiIDB,
	createStubCrudApiDefShape,
	type DB_TestItem,
	TestBaseApi,
	TestBaseApiUpgrade,
	TestBaseApiValidation,
	testItemBaseDBConfig,
	type TestItemTypes,
	type UI_TestItem
} from './test-utils.js';

declare global {
	interface Window {
		DbApiFrontend: {
			ModuleFE_BaseDB: typeof ModuleFE_BaseDB;
			ModuleFE_BaseApi: typeof ModuleFE_BaseApi;
			TestBaseApi: typeof TestBaseApi;
			TestBaseApiValidation: typeof TestBaseApiValidation;
			TestBaseApiUpgrade: typeof TestBaseApiUpgrade;
			testItemBaseDBConfig: typeof testItemBaseDBConfig;
			createStubCrudApiDefShape: typeof createStubCrudApiDefShape;
			cleanupDbApiIDB: typeof cleanupDbApiIDB;
			HttpClient: typeof HttpClient
			TestItemTypes: unknown;
			DB_TestItem: unknown;
			UI_TestItem: unknown;
		};
	}

	type _Window = typeof window;
}


window.DbApiFrontend = {
	ModuleFE_BaseDB,
	ModuleFE_BaseApi,
	TestBaseApi,
	TestBaseApiValidation,
	TestBaseApiUpgrade,
	testItemBaseDBConfig,
	createStubCrudApiDefShape,
	cleanupDbApiIDB,
	HttpClient,
	TestItemTypes: undefined as unknown as TestItemTypes,
	DB_TestItem: undefined as unknown as DB_TestItem,
	UI_TestItem: undefined as unknown as UI_TestItem
};

// Note: tests should construct and inject a test HttpClient instance into TestBaseApi
// instead of relying on global overrides. This keeps tests isolated and avoids
// modifying prototype behavior at runtime.

export {
	ModuleFE_BaseDB,
	ModuleFE_BaseApi,
	TestBaseApi,
	TestBaseApiValidation,
	TestBaseApiUpgrade,
	testItemBaseDBConfig,
	createStubCrudApiDefShape,
	cleanupDbApiIDB
};
