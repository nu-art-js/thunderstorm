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

import {ModuleFE_PermissionsUser} from '../modules/assign/ModuleFE_PermissionsUser';
import {ModuleFE_PermissionsGroup} from '../modules/assign/ModuleFE_PermissionsGroup';
import {ModuleFE_PermissionsProject} from '../modules/manage/ModuleFE_PermissionsProject';
import {ModuleFE_PermissionsDomain} from '../modules/manage/ModuleFE_PermissionsDomain';
import {ModuleFE_PermissionsAccessLevel} from '../modules/manage/ModuleFE_PermissionsAccessLevel';
import {ModuleFE_PermissionsApi} from '../modules/manage/ModuleFE_PermissionsApi';


export const ModulePack_Frontend_Permissions = [
	ModuleFE_PermissionsUser,
	ModuleFE_PermissionsGroup,
	ModuleFE_PermissionsProject,
	ModuleFE_PermissionsDomain,
	ModuleFE_PermissionsAccessLevel,
	ModuleFE_PermissionsApi,
];

export * from '../modules/assign/ModuleFE_PermissionsUser';
export * from '../modules/assign/ModuleFE_PermissionsGroup';
export * from '../modules/manage/ModuleFE_PermissionsProject';
export * from '../modules/manage/ModuleFE_PermissionsDomain';
export * from '../modules/manage/ModuleFE_PermissionsAccessLevel';
export * from '../modules/manage/ModuleFE_PermissionsApi';
