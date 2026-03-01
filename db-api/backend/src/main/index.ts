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

export type {BaseDBDefBE, BaseDBDefBE_Dependency, DBApiBEConfigShape, PostWriteProcessingDataShape} from './backend-types.js';
export {ModuleBE_BaseDB, BaseDBApiConfig, DBApiConfig} from './ModuleBE_BaseDB.js';
export {ModuleBE_BaseApi_Class, createApisForDBModule, RuntimeBE_Modules} from './ModuleBE_BaseApi.js';
export type {DBApiBEConfig, DBEntityDependencies, DBEntityDependencyError, EntityDependencyCollection} from './storm-stubs.js';
export {getModuleBEConfig, dispatch_CollectEntityDependencies} from './storm-stubs.js';
