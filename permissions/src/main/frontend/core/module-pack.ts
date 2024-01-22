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
import {ModuleFE_PermissionsAssert} from '../modules/ModuleFE_PermissionsAssert';
import {
	ModulePackFE_PermissionAccessLevel,
	ModulePackFE_PermissionAPI,
	ModulePackFE_PermissionDomain,
	ModulePackFE_PermissionGroup,
	ModulePackFE_PermissionProject,
	ModulePackFE_PermissionUser
} from '../_entity';

export const ModulePackFE_Permissions: Module[] = [
	ModuleFE_PermissionsAssert,
	...ModulePackFE_PermissionAccessLevel,
	...ModulePackFE_PermissionAPI,
	...ModulePackFE_PermissionProject,
	...ModulePackFE_PermissionDomain,
	...ModulePackFE_PermissionGroup,
	...ModulePackFE_PermissionUser,
];