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
import {ModuleBE_PermissionGroup, ModuleBE_PermissionUser} from '../modules/assignment';
import {PermissionsModule} from '../modules/PermissionsModule';
import {PermissionsAssert} from '../modules/permissions-assert';


export const ModulePack_Backend_Permissions = [
	ModuleBE_PermissionProject,
	ModuleBE_PermissionDomain,
	ModuleBE_PermissionAccessLevel,
	ModuleBE_PermissionApi,
	ModuleBE_PermissionGroup,
	ModuleBE_PermissionUser,
	PermissionsAssert,
	PermissionsModule,
];

export * from '../modules/permissions-assert';
export * from '../modules/PermissionsModule';