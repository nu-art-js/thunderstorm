/*
 * ts-common is the basic building blocks of our typescript projects
 *
 * Copyright (C) 2020 Intuition Robotics
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

import {BaseDB_ApiGeneratorCaller} from "@ir/db-api-generator/frontend";
import {DB_PermissionsUser} from "../../../index";
import {ThunderDispatcher} from "@ir/thunderstorm/frontend";

export interface OnPermissionsUsersLoaded {
	__onPermissionsUsersLoaded: () => void;
}

const dispatch_onPermissionsUsersLoaded = new ThunderDispatcher<OnPermissionsUsersLoaded, "__onPermissionsUsersLoaded">("__onPermissionsUsersLoaded");

export class PermissionsUserModule_Class
	extends BaseDB_ApiGeneratorCaller<DB_PermissionsUser> {
	private users: DB_PermissionsUser[] = [];

	constructor() {
		super({key: "user", relativeUrl: "/v1/permissions/assign/user"});
	}

	protected init(): void {
	}

	protected async onEntryCreated(response: DB_PermissionsUser): Promise<void> {
	}

	protected async onEntryDeleted(response: DB_PermissionsUser): Promise<void> {
	}

	protected async onEntryUpdated(response: DB_PermissionsUser): Promise<void> {
		this.query();
	}

	protected async onGotUnique(response: DB_PermissionsUser): Promise<void> {
	}

	protected async onQueryReturned(response: DB_PermissionsUser[]): Promise<void> {
		this.users = response;
		dispatch_onPermissionsUsersLoaded.dispatchUI([]);
	}

	getUserByAccountId(accountId: string) {
		return this.users.filter(user=>user.accountId).find(user => user.accountId === accountId);
	}

	getUsers() {
		return this.users;
	}
}

export const ApiCaller_PermissionsUser = new PermissionsUserModule_Class();
