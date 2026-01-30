import { TestBaseApi, TestBaseApiUpgrade, TestBaseApiValidation } from './unit/run-serialized-by-id/test-base-api.js';
import { createStubCrudApiDefShape, testItemBaseDBConfig, type DB_TestItem, type TestItemTypes, type UI_TestItem } from './fixtures/index.js';
/**
 * Clears IndexedDB storage used by db-api tests.
 * Call in beforeEach() for test isolation.
 */
export declare function cleanupDbApiIDB(): Promise<void>;
export { TestBaseApi, TestBaseApiUpgrade, TestBaseApiValidation };
export { testItemBaseDBConfig, createStubCrudApiDefShape };
export type { DB_TestItem, TestItemTypes, UI_TestItem };
