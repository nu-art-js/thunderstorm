"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canDeleteDispatcher = exports.getModuleBEConfig = exports.Const_LockKeys = void 0;
const __1 = require("..");
const ts_common_1 = require("@nu-art/ts-common");
exports.Const_LockKeys = [__1.Const_UniqueKey, '_v', '__created', '__updated'];
const getModuleBEConfig = (dbDef) => {
    const dbDefValidator = typeof dbDef.validator === 'function' ?
        [((instance) => {
                const dbObjectOnly = ts_common_1.KeysOfDB_Object.reduce((objectToRet, key) => {
                    if ((0, ts_common_1.exists)(instance[key]))
                        objectToRet[key] = instance[key];
                    return objectToRet;
                }, {});
                return (0, ts_common_1.tsValidateResult)(dbObjectOnly, __1.DB_Object_validator);
            }), dbDef.validator] : Object.assign(Object.assign({}, __1.DB_Object_validator), dbDef.validator);
    return {
        collectionName: dbDef.dbName,
        validator: dbDefValidator,
        uniqueKeys: dbDef.uniqueKeys || [__1.Const_UniqueKey],
        lockKeys: dbDef.lockKeys || dbDef.uniqueKeys || [...exports.Const_LockKeys],
        itemName: dbDef.entityName,
        versions: dbDef.versions || [__1.DefaultDBVersion],
    };
};
exports.getModuleBEConfig = getModuleBEConfig;
exports.canDeleteDispatcher = new ts_common_1.Dispatcher('__canDeleteEntities');
//# sourceMappingURL=db-def.js.map