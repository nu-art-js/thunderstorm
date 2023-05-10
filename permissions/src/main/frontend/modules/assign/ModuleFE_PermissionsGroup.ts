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
import {DB_PermissionGroup, DBDef_PermissionGroup} from '../../../index';
import {ApiCallerEventTypeV2, ModuleFE_BaseApi} from '@nu-art/db-api-generator/frontend';
import {ThunderDispatcher} from '@nu-art/thunderstorm/frontend';


export interface OnPermissionsGroupsUpdated {
	__onPermissionsGroupsUpdated: (...params: ApiCallerEventTypeV2<DB_PermissionGroup>) => void;
}

const dispatch_OnPermissionsGroupsUpdated = new ThunderDispatcher<OnPermissionsGroupsUpdated, '__onPermissionsGroupsUpdated'>('__onPermissionsGroupsUpdated');

export class ModuleFE_PermissionsGroup_Class
	extends ModuleFE_BaseApi<DB_PermissionGroup> {

	constructor() {
		super(DBDef_PermissionGroup, dispatch_OnPermissionsGroupsUpdated);
	}
}

export const ModuleFE_PermissionsGroup = new ModuleFE_PermissionsGroup_Class();
