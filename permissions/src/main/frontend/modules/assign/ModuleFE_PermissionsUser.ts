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

import {BaseDB_ApiGeneratorCaller} from '@nu-art/db-api-generator/frontend';
import {DB_PermissionUser, DBDef_PermissionUser} from '../../../index';
import {ThunderDispatcher} from '@nu-art/thunderstorm/frontend';


export interface OnPermissionsUsersLoaded {
	__onPermissionsUsersLoaded: () => void;
}

const dispatch_onPermissionsUsersLoaded = new ThunderDispatcher<OnPermissionsUsersLoaded, '__onPermissionsUsersLoaded'>('__onPermissionsUsersLoaded');

export class ModuleFE_PermissionsUser_Class
	extends BaseDB_ApiGeneratorCaller<DB_PermissionUser> {
	private users: DB_PermissionUser[] = [];

	constructor() {
		super(DBDef_PermissionUser);
	}

	protected init(): void {
	}

	protected async onEntryCreated(response: DB_PermissionUser): Promise<void> {
	}

	protected async onEntryDeleted(response: DB_PermissionUser): Promise<void> {
	}

	protected async onEntryUpdated(response: DB_PermissionUser): Promise<void> {
		this.v1.query({where: {}});
	}

	protected async onGotUnique(response: DB_PermissionUser): Promise<void> {
	}

	protected async onQueryReturned(response: DB_PermissionUser[]): Promise<void> {
		this.users = response;
		dispatch_onPermissionsUsersLoaded.dispatchUI();
	}

	getUserByAccountId(accountId: string) {
		return this.users.filter(user => user.accountId).find(user => user.accountId === accountId);
	}

	getUsers() {
		return this.users;
	}
}

export const ModuleFE_PermissionsUser = new ModuleFE_PermissionsUser_Class();
