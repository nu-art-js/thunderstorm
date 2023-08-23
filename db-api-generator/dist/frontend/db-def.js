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
exports.getModuleFEConfig = void 0;
const ts_common_1 = require("@nu-art/ts-common");
const getModuleFEConfig = (dbDef) => {
    //FE validator ignores any props that are defined in dbdef.generatedProps
    const validator = [...dbDef.generatedProps || [], ...ts_common_1.KeysOfDB_Object].reduce((_validator, prop) => {
        { // @ts-ignore
            _validator[prop] = ts_common_1.tsValidateOptional;
        }
        return _validator;
    }, dbDef.validator);
    return {
        key: dbDef.dbName,
        versions: dbDef.versions || [ts_common_1.DefaultDBVersion],
        validator: validator,
        dbConfig: {
            version: 1,
            name: dbDef.dbName,
            indices: dbDef.indices,
            autoIncrement: false,
            uniqueKeys: dbDef.uniqueKeys || [ts_common_1.Const_UniqueKey]
        },
    };
};
exports.getModuleFEConfig = getModuleFEConfig;
//# sourceMappingURL=db-def.js.map