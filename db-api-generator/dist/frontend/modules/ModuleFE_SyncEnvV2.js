"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleFE_SyncEnvV2 = void 0;
const frontend_1 = require("@nu-art/thunderstorm/frontend");
const ts_common_1 = require("@nu-art/ts-common");
const shared_1 = require("../shared");
class ModuleFE_SyncEnvV2_Class extends ts_common_1.Module {
    constructor() {
        super();
        this.vv1 = {
            fetchFromEnv: (0, frontend_1.apiWithBody)(shared_1.ApiDef_SyncEnvV2.vv1.fetchFromEnv),
            createBackup: (0, frontend_1.apiWithQuery)(shared_1.ApiDef_SyncEnvV2.vv1.createBackup),
            fetchBackupMetadata: (0, frontend_1.apiWithQuery)(shared_1.ApiDef_SyncEnvV2.vv1.fetchBackupMetadata),
            fetchFirebaseBackup: (0, frontend_1.apiWithQuery)(shared_1.ApiDef_SyncEnvV2.vv1.fetchFirebaseBackup)
        };
    }
}
exports.ModuleFE_SyncEnvV2 = new ModuleFE_SyncEnvV2_Class();
//# sourceMappingURL=ModuleFE_SyncEnvV2.js.map