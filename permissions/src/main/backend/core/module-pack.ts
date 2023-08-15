/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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

import {ModuleBE_PermissionsAssert} from '../modules/ModuleBE_PermissionsAssert';
import {ModuleBE_PermissionProject} from '../modules/management/ModuleBE_PermissionProject';
import {ModuleBE_PermissionDomain} from '../modules/management/ModuleBE_PermissionDomain';
import {ModuleBE_PermissionAccessLevel} from '../modules/management/ModuleBE_PermissionAccessLevel';
import {ModuleBE_PermissionApi} from '../modules/management/ModuleBE_PermissionApi';
import {ModuleBE_PermissionGroup} from '../modules/assignment/ModuleBE_PermissionGroup';
import {ModuleBE_PermissionUserDB} from '../modules/assignment/ModuleBE_PermissionUserDB';
import {createApisForDBModuleV2} from '@nu-art/db-api-generator/backend';
import {Module} from '@nu-art/ts-common';
import {ModuleBE_Permissions} from '../modules/ModuleBE_Permissions';


export const ModulePackBE_Permissions: Module[] = [
	ModuleBE_PermissionProject, createApisForDBModuleV2(ModuleBE_PermissionProject),
	ModuleBE_PermissionDomain, createApisForDBModuleV2(ModuleBE_PermissionDomain),
	ModuleBE_PermissionAccessLevel, createApisForDBModuleV2(ModuleBE_PermissionAccessLevel),
	ModuleBE_PermissionApi, createApisForDBModuleV2(ModuleBE_PermissionApi),
	ModuleBE_PermissionUserDB, createApisForDBModuleV2(ModuleBE_PermissionUserDB),
	ModuleBE_PermissionGroup, createApisForDBModuleV2(ModuleBE_PermissionGroup),
	ModuleBE_PermissionsAssert,
	ModuleBE_Permissions,
];

export * from '../modules/ModuleBE_PermissionsAssert';