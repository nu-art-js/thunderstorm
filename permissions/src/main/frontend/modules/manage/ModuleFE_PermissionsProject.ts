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

import {ModuleFE_BaseApi, ThunderDispatcher} from '@nu-art/thunderstorm/frontend';
import {DB_PermissionProject, DBDef_PermissionProjects} from '../../shared';
import {ApiCallerEventType} from '@nu-art/thunderstorm/frontend/core/db-api-gen/types';


export interface OnPermissionsProjectsUpdated {
	__OnPermissionsProjectsUpdated: (...params: ApiCallerEventType<DB_PermissionProject>) => void;
}

const dispatch_OnPermissionsProjectsUpdated = new ThunderDispatcher<OnPermissionsProjectsUpdated, '__OnPermissionsProjectsUpdated'>(
	'__OnPermissionsProjectsUpdated');

export class ModuleFE_PermissionsProject_Class
	extends ModuleFE_BaseApi<DB_PermissionProject> {

	constructor() {
		super(DBDef_PermissionProjects, dispatch_OnPermissionsProjectsUpdated);
	}
}

export const ModuleFE_PermissionsProject = new ModuleFE_PermissionsProject_Class();
export const ModuleFE_PermissionsProject_ = ModuleFE_PermissionsProject as unknown as ModuleFE_BaseApi<any, any>;
