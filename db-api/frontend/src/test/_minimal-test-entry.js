/*
 * Minimal test entry - only BaseDB, no BaseApi/ApiCaller
 */
import { ModuleFE_BaseDB } from '../main/base/index.js';
import { cleanupDbApiIDB } from './test-utils.js';
window.DbApiFrontendMinimal = {
    ModuleFE_BaseDB,
    cleanupDbApiIDB
};
//# sourceMappingURL=_minimal-test-entry.js.map