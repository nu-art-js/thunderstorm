"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiDef_SyncManager = exports.DBApiDefGeneratorIDB = exports.DBApiDefGenerator = exports._EmptyQuery = void 0;
const thunderstorm_1 = require("@nu-art/thunderstorm");
const ts_common_1 = require("@nu-art/ts-common");
exports._EmptyQuery = Object.freeze({ where: {} });
const DBApiDefGenerator = (dbDef) => {
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
exports.DBApiDefGenerator = DBApiDefGenerator;
const DBApiDefGeneratorIDB = (dbDef) => {
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
exports.DBApiDefGeneratorIDB = DBApiDefGeneratorIDB;
exports.ApiDef_SyncManager = {
    v1: {
        checkSync: { method: thunderstorm_1.HttpMethod.GET, path: 'v1/db-api/sync-all' },
    }
};
//# sourceMappingURL=api.js.map