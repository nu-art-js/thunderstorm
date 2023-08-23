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
exports.DBApiDefGeneratorIDBV2 = exports.DBApiDefGeneratorV2 = void 0;
const thunderstorm_1 = require("@nu-art/thunderstorm");
const ts_common_1 = require("@nu-art/ts-common");
const DBApiDefGeneratorV2 = (dbDef) => {
    return {
        v1: {
            sync: { method: thunderstorm_1.HttpMethod.POST, path: `v1/${dbDef.dbName}/query`, timeout: 60 * ts_common_1.Second },
            query: { method: thunderstorm_1.HttpMethod.POST, path: `v1/${dbDef.dbName}/query` },
            queryUnique: { method: thunderstorm_1.HttpMethod.GET, path: `v1/${dbDef.dbName}/query-unique` },
            upsert: { method: thunderstorm_1.HttpMethod.POST, path: `v1/${dbDef.dbName}/upsert` },
            upsertAll: { method: thunderstorm_1.HttpMethod.POST, path: `v1/${dbDef.dbName}/upsert-all` },
            patch: { method: thunderstorm_1.HttpMethod.POST, path: `v1/${dbDef.dbName}/patch` },
            delete: { method: thunderstorm_1.HttpMethod.GET, path: `v1/${dbDef.dbName}/delete-unique` },
            deleteQuery: { method: thunderstorm_1.HttpMethod.POST, path: `v1/${dbDef.dbName}/delete` },
            deleteAll: { method: thunderstorm_1.HttpMethod.GET, path: `v1/${dbDef.dbName}/delete-all` },
            upgradeCollection: { method: thunderstorm_1.HttpMethod.POST, path: `v1/${dbDef.dbName}/upgrade-collection` },
            metadata: { method: thunderstorm_1.HttpMethod.GET, path: `v1/${dbDef.dbName}/metadata` },
        }
    };
};
exports.DBApiDefGeneratorV2 = DBApiDefGeneratorV2;
const DBApiDefGeneratorIDBV2 = (dbDef) => {
    return {
        v1: {
            sync: { method: thunderstorm_1.HttpMethod.POST, path: `v1/${dbDef.dbName}/sync`, timeout: 60 * ts_common_1.Second },
            query: { method: thunderstorm_1.HttpMethod.POST, path: `v1/${dbDef.dbName}/query` },
            queryUnique: { method: thunderstorm_1.HttpMethod.GET, path: `v1/${dbDef.dbName}/query-unique` },
            upsert: { method: thunderstorm_1.HttpMethod.POST, path: `v1/${dbDef.dbName}/upsert` },
            upsertAll: { method: thunderstorm_1.HttpMethod.POST, path: `v1/${dbDef.dbName}/upsert-all` },
            patch: { method: thunderstorm_1.HttpMethod.POST, path: `v1/${dbDef.dbName}/patch` },
            delete: { method: thunderstorm_1.HttpMethod.GET, path: `v1/${dbDef.dbName}/delete-unique` },
            deleteQuery: { method: thunderstorm_1.HttpMethod.POST, path: `v1/${dbDef.dbName}/delete` },
            deleteAll: { method: thunderstorm_1.HttpMethod.GET, path: `v1/${dbDef.dbName}/delete-all` },
            upgradeCollection: { method: thunderstorm_1.HttpMethod.POST, path: `v1/${dbDef.dbName}/upgrade-collection` },
            metadata: { method: thunderstorm_1.HttpMethod.GET, path: `v1/${dbDef.dbName}/metadata` },
        }
    };
};
exports.DBApiDefGeneratorIDBV2 = DBApiDefGeneratorIDBV2;
//# sourceMappingURL=apiV2.js.map