"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleFE_Archiving = void 0;
const ts_common_1 = require("@nu-art/ts-common");
const frontend_1 = require("@nu-art/thunderstorm/frontend");
const apis_1 = require("../../shared/archiving/apis");
class ModuleFE_Archiving_Class extends ts_common_1.Module {
    constructor() {
        super();
        this.vv1 = {
            hardDeleteAll: (0, frontend_1.apiWithQuery)(apis_1.ApiDef_Archiving.vv1.hardDeleteAll),
            hardDeleteUnique: (0, frontend_1.apiWithBody)(apis_1.ApiDef_Archiving.vv1.hardDeleteUnique),
            getDocumentHistory: (0, frontend_1.apiWithQuery)(apis_1.ApiDef_Archiving.vv1.getDocumentHistory)
        };
    }
}
exports.ModuleFE_Archiving = new ModuleFE_Archiving_Class();
//# sourceMappingURL=ModuleFE_Archiving.js.map