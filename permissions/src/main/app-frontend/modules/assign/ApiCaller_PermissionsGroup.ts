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
import {
	ApiBinder_GetCustomFields,
	DB_PermissionsGroup
} from "../../../index";
import {BaseDB_ApiGeneratorCaller} from "@nu-art/db-api-generator/frontend";
import {
	HttpModule,
	ThunderDispatcher
} from "@nu-art/thunderstorm/frontend";
import {HttpMethod} from "@nu-art/thunderstorm";

export const Key_FetchCustomFields = 'get-custom-fields';

export interface OnPermissionsGroupsLoaded {
	__onPermissionsGroupsLoaded: () => void;
}

const dispatch_onPermissionsGroupsLoaded = new ThunderDispatcher<OnPermissionsGroupsLoaded, "__onPermissionsGroupsLoaded">("__onPermissionsGroupsLoaded");

export class PermissionsGroupModule_Class
	extends BaseDB_ApiGeneratorCaller<DB_PermissionsGroup> {
	private groups: DB_PermissionsGroup[] = [];
	private customFields: string[] = [];

	constructor() {
		super({key: "group", relativeUrl: "/v1/permissions/assign/group"});
	}

	protected init(): void {
		super.init();
		this.fetchCustomFieldsKeys()
	}

	protected async onEntryCreated(response: DB_PermissionsGroup): Promise<void> {
		this.query();
	}

	protected async onEntryDeleted(response: DB_PermissionsGroup): Promise<void> {
		this.query();
	}

	protected async onEntryUpdated(response: DB_PermissionsGroup): Promise<void> {
		this.query();
	}

	protected async onGotUnique(response: DB_PermissionsGroup): Promise<void> {
	}

	protected async onQueryReturned(response: DB_PermissionsGroup[]): Promise<void> {
		this.groups = response;
		dispatch_onPermissionsGroupsLoaded.dispatchUI([]);
	}

	getGroups() {
		return this.groups;
	}

	fetchCustomFieldsKeys() {
		HttpModule
			.createRequest<ApiBinder_GetCustomFields>(HttpMethod.GET, Key_FetchCustomFields)
			.setRelativeUrl(`/v1/permissions/assign/get-custom-fields`)
			.setOnError(`Failed to get permissions custom fields - by firebase config`)
			.setLabel(`Getting permissions custom fields - by firebase config`)
			.execute(async (customFields: string[]) => {
				this.customFields = customFields;
			});
	}

	getCustomFields = () => this.customFields

}

export const ApiCaller_PermissionsGroup = new PermissionsGroupModule_Class();
