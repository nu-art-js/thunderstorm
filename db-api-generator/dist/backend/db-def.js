"use strict";
/*
 * Database API Generator is a utility library for Thunderstorm.
 *
 * Given proper configurations it will dynamically generate APIs to your Firestore
 * collections, will assert uniqueness and restrict deletion... and more
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.canDeleteDispatcher = exports.getModuleBEConfig = exports.Const_LockKeys = void 0;
const ts_common_1 = require("@nu-art/ts-common");
exports.Const_LockKeys = [ts_common_1.Const_UniqueKey, '_v', '__created', '__updated'];
function getDbDefValidator(dbDef) {
    if (typeof dbDef.validator === 'function') {
        return [(instance) => (0, ts_common_1.tsValidateResult)((0, ts_common_1.keepDBObjectKeys)(instance), ts_common_1.DB_Object_validator), dbDef.validator];
    }
    return Object.assign(Object.assign({}, ts_common_1.DB_Object_validator), dbDef.validator);
}
const getModuleBEConfig = (dbDef) => {
    const dbDefValidator = getDbDefValidator(dbDef);
    return {
        collectionName: dbDef.dbName,
        validator: dbDefValidator,
        uniqueKeys: dbDef.uniqueKeys || ts_common_1.Const_UniqueKeys,
        lockKeys: dbDef.lockKeys || dbDef.uniqueKeys || [...exports.Const_LockKeys],
        itemName: dbDef.entityName,
        versions: dbDef.versions || [ts_common_1.DefaultDBVersion],
        TTL: dbDef.TTL || ts_common_1.Hour * 2,
        lastUpdatedTTL: dbDef.lastUpdatedTTL || ts_common_1.Day
    };
};
exports.getModuleBEConfig = getModuleBEConfig;
exports.canDeleteDispatcher = new ts_common_1.Dispatcher('__canDeleteEntities');
//# sourceMappingURL=db-def.js.map