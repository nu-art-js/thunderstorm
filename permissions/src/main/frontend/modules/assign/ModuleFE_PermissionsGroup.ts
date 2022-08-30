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
import {BaseDB_ApiGeneratorCaller} from '@nu-art/db-api-generator/frontend';
import {ThunderDispatcher} from '@nu-art/thunderstorm/frontend';


export interface OnPermissionsGroupsLoaded {
	__onPermissionsGroupsLoaded: () => void;
}

const dispatch_onPermissionsGroupsLoaded = new ThunderDispatcher<OnPermissionsGroupsLoaded, '__onPermissionsGroupsLoaded'>('__onPermissionsGroupsLoaded');

export class ModuleFE_PermissionsGroup_Class
	extends BaseDB_ApiGeneratorCaller<DB_PermissionGroup> {
	private groups: DB_PermissionGroup[] = [];

	constructor() {
		super(DBDef_PermissionGroup);
	}

	protected init(): void {
		super.init();
	}

	protected async onEntryCreated(response: DB_PermissionGroup): Promise<void> {
		this.v1.query({where: {}});
	}

	protected async onEntryDeleted(response: DB_PermissionGroup): Promise<void> {
		this.v1.query({where: {}});
	}

	protected async onEntryUpdated(response: DB_PermissionGroup): Promise<void> {
		this.v1.query({where: {}});
	}

	protected async onGotUnique(response: DB_PermissionGroup): Promise<void> {
	}

	protected async onQueryReturned(response: DB_PermissionGroup[]): Promise<void> {
		this.groups = response;
		dispatch_onPermissionsGroupsLoaded.dispatchUI();
	}

	getGroups() {
		return this.groups;
	}

}

export const ModuleFE_PermissionsGroup = new ModuleFE_PermissionsGroup_Class();
