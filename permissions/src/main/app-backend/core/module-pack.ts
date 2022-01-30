/*
 * ts-common is the basic building blocks of our typescript projects
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

import {AccessLevelPermissionsDB, ApiPermissionsDB, DomainPermissionsDB, ProjectPermissionsDB} from '../modules/db-types/managment';
import {GroupPermissionsDB, UserPermissionsDB} from '../modules/db-types/assign';
import {PermissionsAssert} from '../modules/permissions-assert';
import {PermissionsModule} from '../modules/PermissionsModule';

export const Backend_ModulePack_Permissions = [
	ProjectPermissionsDB,
	DomainPermissionsDB,
	AccessLevelPermissionsDB,
	ApiPermissionsDB,
	GroupPermissionsDB,
	UserPermissionsDB,
	PermissionsAssert,
	PermissionsModule,
];

export * from '../modules/db-types/managment';
export * from '../modules/db-types/assign';
export * from '../modules/permissions-assert';
export * from '../modules/PermissionsModule';