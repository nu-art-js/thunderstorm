import { ModuleFE_BaseApi, ModuleFE_BaseDB } from '../main/base/index.js';
import { HttpClient } from '@nu-art/http-client';
import { cleanupDbApiIDB, createStubCrudApiDefShape, TestBaseApi, TestBaseApiUpgrade, TestBaseApiValidation, testItemBaseDBConfig } from './test-utils.js';
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
            HttpClient: typeof HttpClient;
            TestItemTypes: unknown;
            DB_TestItem: unknown;
            UI_TestItem: unknown;
        };
    }
    type _Window = typeof window;
}
export { ModuleFE_BaseDB, ModuleFE_BaseApi, TestBaseApi, TestBaseApiValidation, TestBaseApiUpgrade, testItemBaseDBConfig, createStubCrudApiDefShape, cleanupDbApiIDB };
