"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModuleBEConfigV3 = exports.getDbDefValidator = exports.Const_LockKeys = void 0;
const ts_common_1 = require("@nu-art/ts-common");
exports.Const_LockKeys = [ts_common_1.Const_UniqueKey, '_v', '__created', '__updated'];
const getDbDefValidator = (dbDef) => {
    if (typeof dbDef.modifiablePropsValidator === 'object' && typeof dbDef.generatedPropsValidator === 'object')
        return Object.assign(Object.assign({}, dbDef.generatedPropsValidator), dbDef.modifiablePropsValidator);
    else if (typeof dbDef.modifiablePropsValidator === 'function' && typeof dbDef.generatedPropsValidator === 'function')
        return [dbDef.modifiablePropsValidator, dbDef.generatedPropsValidator];
    else {
        if (typeof dbDef.modifiablePropsValidator === 'function')
            return [dbDef.modifiablePropsValidator, (instance) => (0, ts_common_1.tsValidateResult)((0, ts_common_1.keepPartialObject)(instance, (0, ts_common_1._keys)(dbDef.generatedPropsValidator)), dbDef.generatedPropsValidator)];
        return [dbDef.generatedPropsValidator, (instance) => (0, ts_common_1.tsValidateResult)((0, ts_common_1.keepPartialObject)(instance, (0, ts_common_1._keys)(dbDef.modifiablePropsValidator)), dbDef.modifiablePropsValidator)];
    }
};
exports.getDbDefValidator = getDbDefValidator;
const getModuleBEConfigV3 = (dbDef) => {
    return {
        collectionName: dbDef.dbName,
        versions: dbDef.versions,
        lockKeys: dbDef.lockKeys,
        uniqueKeys: dbDef.uniqueKeys || ts_common_1.Const_UniqueKeys,
        itemName: dbDef.entityName,
        TTL: dbDef.TTL || ts_common_1.Hour * 2,
        lastUpdatedTTL: dbDef.lastUpdatedTTL || ts_common_1.Day,
        validator: (0, exports.getDbDefValidator)(dbDef)
    };
};
exports.getModuleBEConfigV3 = getModuleBEConfigV3;
//# sourceMappingURL=v3-db-def.js.map