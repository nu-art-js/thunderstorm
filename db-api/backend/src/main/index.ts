/*
 * Database API infrastructure library for Thunderstorm.
 *
 * Backend modules and services for database API operations.
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

export {ModuleBE_BaseDB, BaseDBApiConfig, DBApiConfig} from './ModuleBE_BaseDB.js';
export {ModuleBE_BaseApi_Class, createApisForDBModule} from './ModuleBE_BaseApi.js';
export type {
	DBApiDefIDB,
	DBApiType_Query,
	DBApiType_QueryUnique,
	DBApiType_Upsert,
	DBApiType_UpsertAll,
	DBApiType_Patch,
	DBApiType_Delete,
	DBApiType_DeleteQuery,
	DBApiType_DeleteAll,
	DBApiType_Metadata,
} from '@nu-art/db-api-shared';
export {
	DBApiDefGeneratorIDB,
	dbApiDef_Query,
	dbApiDef_QueryUnique,
	dbApiDef_Upsert,
	dbApiDef_UpsertAll,
	dbApiDef_Patch,
	dbApiDef_Delete,
	dbApiDef_DeleteQuery,
	dbApiDef_DeleteAll,
	dbApiDef_Metadata,
} from '@nu-art/db-api-shared';
export type {DBApiBEConfig, DBEntityDependencies, DBEntityDependencyError, EntityDependencyCollection, Response_DBSync} from './storm-stubs.js';
export {getModuleBEConfig, ModuleBE_SyncManager, dispatch_CollectEntityDependencies} from './storm-stubs.js';
export type {CrudTypes, BaseDBDefBE} from '@nu-art/db-api-shared';
