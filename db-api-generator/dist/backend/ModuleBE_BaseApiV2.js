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
exports.createApisForDBModuleV2 = exports.ModuleBE_BaseApiV2_Class = void 0;
const ts_common_1 = require("@nu-art/ts-common");
const backend_1 = require("@nu-art/thunderstorm/backend");
const shared_1 = require("../shared");
/**
 * A base class used for implementing CRUD operations on a db module collection.
 *
 * By default, it exposes API endpoints for creating, deleting, updating, querying and querying for unique document.
 */
class ModuleBE_BaseApiV2_Class extends ts_common_1.Module {
    constructor(dbModule) {
        super(`Gen(${dbModule.getName()}, Api)`);
        this._metadata = async () => {
            return Object.assign(Object.assign({}, this.dbModule.dbDef.metadata), ts_common_1.DB_Object_Metadata) || `not implemented yet for collection '${this.dbModule.dbDef.dbName}'`;
        };
        this._upgradeCollection = async (body) => {
            return this.dbModule.upgradeCollection(body.forceUpdate || false);
        };
        this._deleteQuery = async (query) => {
            if (!query.where)
                throw new ts_common_1.ApiException(400, `Cannot delete without a where clause, using query: ${(0, ts_common_1.__stringify)(query)}`);
            if ((0, ts_common_1._values)(query.where).filter(v => v === undefined || v === null).length > 0)
                throw new ts_common_1.ApiException(400, `Cannot delete with property value undefined or null, using query: ${(0, ts_common_1.__stringify)(query)}`);
            return this.dbModule.delete.query(query);
        };
        this.dbModule = dbModule;
    }
    init() {
        const apiDef = (0, shared_1.DBApiDefGeneratorIDBV2)(this.dbModule.dbDef);
        (0, backend_1.addRoutes)([
            (0, backend_1.createBodyServerApi)(apiDef.v1.query, this.dbModule.query.custom),
            (0, backend_1.createBodyServerApi)(apiDef.v1.sync, this.dbModule.querySync),
            (0, backend_1.createQueryServerApi)(apiDef.v1.queryUnique, async (queryObject) => {
                const toReturnItem = await this.dbModule.query.unique(queryObject._id);
                if (!toReturnItem)
                    throw new ts_common_1.ApiException(404, `Could not find ${this.dbModule.collection.dbDef.entityName} with _id: ${queryObject._id}`);
                return toReturnItem;
            }),
            (0, backend_1.createBodyServerApi)(apiDef.v1.upsert, this.dbModule.set.item),
            (0, backend_1.createBodyServerApi)(apiDef.v1.upsertAll, (body) => this.dbModule.set.all(body)),
            (0, backend_1.createQueryServerApi)(apiDef.v1.delete, (toDeleteObject) => this.dbModule.delete.unique(toDeleteObject._id)),
            (0, backend_1.createBodyServerApi)(apiDef.v1.deleteQuery, this._deleteQuery),
            (0, backend_1.createQueryServerApi)(apiDef.v1.deleteAll, () => this.dbModule.delete.query(shared_1._EmptyQuery)),
            (0, backend_1.createBodyServerApi)(apiDef.v1.upgradeCollection, this._upgradeCollection),
            (0, backend_1.createQueryServerApi)(apiDef.v1.metadata, this._metadata)
        ]);
    }
}
exports.ModuleBE_BaseApiV2_Class = ModuleBE_BaseApiV2_Class;
const createApisForDBModuleV2 = (dbModule) => {
    return new ModuleBE_BaseApiV2_Class(dbModule);
};
exports.createApisForDBModuleV2 = createApisForDBModuleV2;
//# sourceMappingURL=ModuleBE_BaseApiV2.js.map