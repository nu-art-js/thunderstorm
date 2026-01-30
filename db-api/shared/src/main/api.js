/*
 * Database API infrastructure library for Thunderstorm.
 *
 * Provides shared API definitions for database operations.
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
import { HttpMethod } from '@nu-art/http-client';
/**
 * Generates API definitions for standard database operations.
 *
 * Creates API endpoint definitions for all database CRUD operations based on the database definition.
 *
 * @template Proto - Database prototype type
 * @param dbDef - Database definition containing dbKey and other metadata
 * @param version - API version string (default: 'v1')
 * @returns API definition resolver for the database operations
 */
export const DBApiDefGenerator = (dbDef, version = 'v1') => {
    return {
        v1: {
            query: { method: HttpMethod.POST, path: `${version}/${dbDef.dbKey}/query`, timeout: 60000 },
            queryUnique: { method: HttpMethod.GET, path: `${version}/${dbDef.dbKey}/query-unique` },
            upsert: { method: HttpMethod.POST, path: `${version}/${dbDef.dbKey}/upsert` },
            upsertAll: { method: HttpMethod.POST, path: `${version}/${dbDef.dbKey}/upsert-all` },
            patch: { method: HttpMethod.POST, path: `${version}/${dbDef.dbKey}/patch` },
            delete: { method: HttpMethod.GET, path: `${version}/${dbDef.dbKey}/delete-unique` },
            deleteQuery: { method: HttpMethod.POST, path: `${version}/${dbDef.dbKey}/delete` },
            deleteAll: { method: HttpMethod.GET, path: `${version}/${dbDef.dbKey}/delete-all` },
            metadata: { method: HttpMethod.GET, path: `${version}/${dbDef.dbKey}/metadata` },
        }
    };
};
/**
 * Generates API definitions for database operations with IndexedDB support.
 *
 * Creates API endpoint definitions optimized for IndexedDB caching and offline support.
 *
 * @template Proto - Database prototype type
 * @param dbDef - Database definition containing dbKey and other metadata
 * @param version - API version string (default: 'v1')
 * @returns API definition resolver for the database operations with IDB support
 */
export const DBApiDefGeneratorIDB = (dbDef, version = 'v1') => {
    return {
        v1: {
            query: { method: HttpMethod.POST, path: `${version}/${dbDef.dbKey}/query`, timeout: 60000 },
            queryUnique: { method: HttpMethod.GET, path: `${version}/${dbDef.dbKey}/query-unique` },
            upsert: { method: HttpMethod.POST, path: `${version}/${dbDef.dbKey}/upsert` },
            upsertAll: { method: HttpMethod.POST, path: `${version}/${dbDef.dbKey}/upsert-all` },
            patch: { method: HttpMethod.POST, path: `${version}/${dbDef.dbKey}/patch` },
            delete: { method: HttpMethod.GET, path: `${version}/${dbDef.dbKey}/delete-unique` },
            deleteQuery: { method: HttpMethod.POST, path: `${version}/${dbDef.dbKey}/delete` },
            deleteAll: { method: HttpMethod.GET, path: `${version}/${dbDef.dbKey}/delete-all` },
            metadata: { method: HttpMethod.GET, path: `${version}/${dbDef.dbKey}/metadata` },
        }
    };
};
//# sourceMappingURL=api.js.map