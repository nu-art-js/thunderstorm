"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiDef_AppConfig = void 0;
const thunderstorm_1 = require("@nu-art/thunderstorm");
exports.ApiDef_AppConfig = {
    vv1: {
        getConfigByKey: { method: thunderstorm_1.HttpMethod.GET, path: 'v1/app-config/get-resolver-data-by-key' },
    }
};
//# sourceMappingURL=apis.js.map