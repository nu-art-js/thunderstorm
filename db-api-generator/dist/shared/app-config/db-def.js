"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBDef_AppConfigs = void 0;
const ts_common_1 = require("@nu-art/ts-common");
// export const Validator_AppConfigData = {
// 	categoriesOrder: tsValidateDynamicObject<TypedMap<UniqueId[]>>(tsValidateArray(tsValidateUniqueId), tsValidateString()),
// 	sourceTag: tsValidateUniqueId,
// 	complaintsTag: tsValidateUniqueId,
// 	diseaseCategory: tsValidateUniqueId,
// 	dpViewsOrder: tsValidator_arrayOfUniqueIds
// };
const Validator_AppConfig = {
    key: (0, ts_common_1.tsValidateString)(),
    data: ts_common_1.tsValidateMustExist,
};
exports.DBDef_AppConfigs = {
    validator: Validator_AppConfig,
    dbName: 'app-configs',
    entityName: 'app-config',
};
//# sourceMappingURL=db-def.js.map