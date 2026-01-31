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

export {ModuleBE_BaseDB, BaseDBApiConfigV3, DBApiConfigV3} from './ModuleBE_BaseDB.js';
export {ModuleBE_BaseApi_Class, createApisForDBModuleV3} from './ModuleBE_BaseApi.js';
export type {ApiStruct_DBApiGenIDBV3, ApiDefResolver_DBApiGenIDBV3} from './db-api-gen-v3.js';
export {DBApiDefGeneratorIDBV3} from './db-api-gen-v3.js';
export type {DBApiBEConfig, DBEntityDependencies, DBEntityDependencyError, EntityDependencyCollection, Response_DBSync} from './storm-stubs.js';
export {getModuleBEConfig, ModuleBE_SyncManager, dispatch_CollectEntityDependencies} from './storm-stubs.js';
export type {CrudTypes, BaseDBDefBE} from '@nu-art/db-api-shared';
