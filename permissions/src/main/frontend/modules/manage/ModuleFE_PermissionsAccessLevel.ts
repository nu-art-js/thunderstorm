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
import {DB_PermissionAccessLevel, DBDef_PermissionAccessLevel} from '../../shared';
import {ApiCallerEventType} from '@nu-art/thunderstorm/frontend/core/db-api-gen/types';


export interface OnPermissionsLevelsUpdated {
	__onPermissionsLevelsUpdated: (...params: ApiCallerEventType<DB_PermissionAccessLevel>) => void;
}

const dispatch_OnPermissionsLevelsUpdated = new ThunderDispatcher<OnPermissionsLevelsUpdated, '__onPermissionsLevelsUpdated'>('__onPermissionsLevelsUpdated');

export class ModuleFE_PermissionsAccessLevel_Class
	extends ModuleFE_BaseApi<DB_PermissionAccessLevel> {

	constructor() {
		super(DBDef_PermissionAccessLevel, dispatch_OnPermissionsLevelsUpdated);
	}
}

export const ModuleFE_PermissionsAccessLevel = new ModuleFE_PermissionsAccessLevel_Class();
export const ModuleFE_PermissionsAccessLevel_ = ModuleFE_PermissionsAccessLevel as unknown as ModuleFE_BaseApi<any, any>;
