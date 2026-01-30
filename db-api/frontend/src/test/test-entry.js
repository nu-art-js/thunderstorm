/*
 * @nu-art/db-api-frontend - Test entry point for Playwright
 * Exposes package exports to window for page.evaluate() — main/ + test-utils only (playwright-tests rule).
 */
import { ModuleFE_BaseApi, ModuleFE_BaseDB } from '../main/base/index.js';
import { HttpClient } from '@nu-art/http-client';
import { cleanupDbApiIDB, createStubCrudApiDefShape, TestBaseApi, TestBaseApiUpgrade, TestBaseApiValidation, testItemBaseDBConfig } from './test-utils.js';
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
    TestItemTypes: undefined,
    DB_TestItem: undefined,
    UI_TestItem: undefined
};
// Note: tests should construct and inject a test HttpClient instance into TestBaseApi
// instead of relying on global overrides. This keeps tests isolated and avoids
// modifying prototype behavior at runtime.
export { ModuleFE_BaseDB, ModuleFE_BaseApi, TestBaseApi, TestBaseApiValidation, TestBaseApiUpgrade, testItemBaseDBConfig, createStubCrudApiDefShape, cleanupDbApiIDB };
//# sourceMappingURL=test-entry.js.map