import { ModuleFE_BaseDB } from '../main/base/index.js';
import { cleanupDbApiIDB } from './test-utils.js';
declare global {
    interface Window {
        DbApiFrontendMinimal: {
            ModuleFE_BaseDB: typeof ModuleFE_BaseDB;
            cleanupDbApiIDB: typeof cleanupDbApiIDB;
        };
    }
}
