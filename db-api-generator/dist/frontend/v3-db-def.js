"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModuleFEConfigV3 = void 0;
const ts_common_1 = require("@nu-art/ts-common");
const getModuleFEConfigV3 = (dbDef) => {
    return {
        key: dbDef.dbName,
        versions: dbDef.versions || [ts_common_1.DefaultDBVersion],
        validator: dbDef.modifiablePropsValidator,
        dbConfig: {
            version: 1,
            name: dbDef.dbName,
            indices: dbDef.indices,
            autoIncrement: false,
            uniqueKeys: dbDef.uniqueKeys || [ts_common_1.Const_UniqueKey]
        },
    };
};
exports.getModuleFEConfigV3 = getModuleFEConfigV3;
//# sourceMappingURL=v3-db-def.js.map