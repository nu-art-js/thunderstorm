"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiDef_SyncEnvV2 = exports.ApiDef_SyncEnv = void 0;
const thunderstorm_1 = require("@nu-art/thunderstorm");
const ts_common_1 = require("@nu-art/ts-common");
exports.ApiDef_SyncEnv = {
    vv1: {
        fetchFromEnv: { method: thunderstorm_1.HttpMethod.POST, path: 'v1/sync-env/fetch-from-env', timeout: 5 * ts_common_1.Minute },
        createBackup: { method: thunderstorm_1.HttpMethod.GET, path: 'v1/sync-env/create-backup', timeout: 5 * ts_common_1.Minute },
        fetchBackupMetadata: { method: thunderstorm_1.HttpMethod.GET, path: 'v1/sync-env/fetch-backup-metadata', timeout: 5 * ts_common_1.Minute }
    }
};
exports.ApiDef_SyncEnvV2 = {
    vv1: {
        fetchFromEnv: { method: thunderstorm_1.HttpMethod.POST, path: 'v1/sync-env/fetch-from-env-v2', timeout: 5 * ts_common_1.Minute },
        createBackup: { method: thunderstorm_1.HttpMethod.GET, path: 'v1/sync-env/create-backup-v2', timeout: 5 * ts_common_1.Minute },
        fetchBackupMetadata: { method: thunderstorm_1.HttpMethod.GET, path: 'v1/sync-env/fetch-backup-metadata', timeout: 5 * ts_common_1.Minute },
        fetchFirebaseBackup: { method: thunderstorm_1.HttpMethod.GET, path: 'v1/sync-env/fetch-firebase-backup', timeout: 5 * ts_common_1.Minute }
    }
};
//# sourceMappingURL=apis.js.map