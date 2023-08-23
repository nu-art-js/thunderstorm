"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleFE_SyncEnv = void 0;
const frontend_1 = require("@nu-art/thunderstorm/frontend");
const ts_common_1 = require("@nu-art/ts-common");
const shared_1 = require("../shared");
class ModuleFE_SyncEnv_Class extends ts_common_1.Module {
    constructor() {
        super();
        this.vv1 = {
            fetchFromEnv: (0, frontend_1.apiWithBody)(shared_1.ApiDef_SyncEnv.vv1.fetchFromEnv),
            createBackup: (0, frontend_1.apiWithQuery)(shared_1.ApiDef_SyncEnv.vv1.createBackup),
            fetchBackupMetadata: (0, frontend_1.apiWithQuery)(shared_1.ApiDef_SyncEnv.vv1.fetchBackupMetadata),
        };
    }
}
exports.ModuleFE_SyncEnv = new ModuleFE_SyncEnv_Class();
//# sourceMappingURL=ModuleFE_SyncEnv.js.map