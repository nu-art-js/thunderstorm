"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiDef_Archiving = void 0;
const thunderstorm_1 = require("@nu-art/thunderstorm");
exports.ApiDef_Archiving = {
    vv1: {
        hardDeleteAll: { method: thunderstorm_1.HttpMethod.GET, path: 'v1/archiving/hard-delete-all' },
        hardDeleteUnique: { method: thunderstorm_1.HttpMethod.POST, path: 'v1/archiving/hard-delete-unique' },
        getDocumentHistory: { method: thunderstorm_1.HttpMethod.GET, path: 'v1/archiving/get-document-history' }
    }
};
//# sourceMappingURL=apis.js.map