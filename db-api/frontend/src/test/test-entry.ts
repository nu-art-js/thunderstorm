/*
 * @nu-art/db-api-frontend - Test entry point for Playwright
 * Exposes package exports to window for page.evaluate() — main/ + test-utils only (playwright-tests rule).
 */

import {ModuleFE_BaseDB, ModuleFE_BaseApi} from '../main/base/index.js';
import {
	cleanupDbApiIDB,
	TestBaseApi,
	TestBaseApiUpgrade,
	TestBaseApiValidation,
	__setTestHttpClientFactory,
	testItemBaseDBConfig,
	createStubCrudApiDefShape,
	type DB_TestItem,
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
			__setTestHttpClientFactory: typeof __setTestHttpClientFactory;
			TestItemTypes: unknown;
			DB_TestItem: unknown;
			UI_TestItem: unknown;
		};
	}
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
	__setTestHttpClientFactory,
	TestItemTypes: undefined as unknown as TestItemTypes,
	DB_TestItem: undefined as unknown as DB_TestItem,
	UI_TestItem: undefined as unknown as UI_TestItem
};

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
