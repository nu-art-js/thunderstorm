"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiDef_SyncEnv = void 0;
const thunderstorm_1 = require("@nu-art/thunderstorm");
exports.ApiDef_SyncEnv = {
    vv1: {
        fetchFromEnv: { method: thunderstorm_1.HttpMethod.POST, path: 'v1/sync-env/fetch-from-env' },
    }
};
//# sourceMappingURL=apis.js.map