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

import {ModuleBE_PermissionAccessLevel, ModuleBE_PermissionApi, ModuleBE_PermissionDomain, ModuleBE_PermissionProject} from '../modules/management';
import {ModuleBE_PermissionGroup, ModuleBE_PermissionUserDB} from '../modules/assignment';
import {ModuleBE_Permissions} from '../modules/ModuleBE_Permissions';
import {ModuleBE_PermissionsAssert} from '../modules/ModuleBE_PermissionsAssert';
import {createApisForDBModule} from '@nu-art/db-api-generator/backend';


export const ModulePack_Backend_Permissions = [
	ModuleBE_PermissionProject, createApisForDBModule(ModuleBE_PermissionProject),
	ModuleBE_PermissionDomain, createApisForDBModule(ModuleBE_PermissionDomain),
	ModuleBE_PermissionAccessLevel, createApisForDBModule(ModuleBE_PermissionAccessLevel),
	ModuleBE_PermissionApi, createApisForDBModule(ModuleBE_PermissionApi),
	ModuleBE_PermissionGroup, createApisForDBModule(ModuleBE_PermissionGroup),
	ModuleBE_PermissionUserDB,
	ModuleBE_PermissionsAssert,
	ModuleBE_Permissions,
];

export * from '../modules/ModuleBE_PermissionsAssert';
export * from '../modules/ModuleBE_Permissions';