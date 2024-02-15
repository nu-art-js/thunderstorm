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

import {Module} from '@nu-art/ts-common';
import {ModuleBE_PermissionsAssert} from '../modules/ModuleBE_PermissionsAssert';
import {ModuleBE_Permissions} from '../modules/ModuleBE_Permissions';
import {ModuleBE_v2_SyncEnv_ServiceAccount} from '../patch/ModuleBE_v2_SyncEnv_ServiceAccount';
import {
	ModulePackBE_PermissionAccessLevel, ModulePackBE_PermissionAPI, ModulePackBE_PermissionDomain,
	ModulePackBE_PermissionGroup, ModulePackBE_PermissionProject, ModulePackBE_PermissionUser
} from '../_entity';

export const ModulePackBE_Permissions: Module[] = [
	...ModulePackBE_PermissionAccessLevel,
	...ModulePackBE_PermissionAPI,
	...ModulePackBE_PermissionProject,
	...ModulePackBE_PermissionDomain,
	...ModulePackBE_PermissionGroup,
	...ModulePackBE_PermissionUser,
	ModuleBE_PermissionsAssert,
	ModuleBE_Permissions,
	ModuleBE_v2_SyncEnv_ServiceAccount,
];

export * from '../modules/ModuleBE_PermissionsAssert';