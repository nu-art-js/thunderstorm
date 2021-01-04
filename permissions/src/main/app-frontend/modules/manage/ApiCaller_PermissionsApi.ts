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

import {DB_PermissionApi} from "../../../index";
import {BaseDB_ApiGeneratorCaller} from "@ir/db-api-generator/frontend";
import {ThunderDispatcher} from "@ir/thunderstorm/frontend";
import {TypedMap} from "@ir/ts-common";


export interface OnPermissionsApisLoaded {
	__onPermissionsApisLoaded: () => void;
}

const dispatch_onPermissionsApisLoaded = new ThunderDispatcher<OnPermissionsApisLoaded, "__onPermissionsApisLoaded">("__onPermissionsApisLoaded");

export class PermissionsApiModule_Class
	extends BaseDB_ApiGeneratorCaller<DB_PermissionApi> {
	private apis: TypedMap<DB_PermissionApi[]> = {};

	constructor() {
		super({key: "level", relativeUrl: "/v1/permissions/manage/api"});
	}

	protected init(): void {
	}

	protected async onEntryCreated(response: DB_PermissionApi): Promise<void> {
		this.query();
	}

	protected async onEntryDeleted(response: DB_PermissionApi): Promise<void> {
		this.query();
	}

	protected async onEntryUpdated(response: DB_PermissionApi): Promise<void> {
		this.query();
	}

	protected async onGotUnique(response: DB_PermissionApi): Promise<void> {
	}

	protected async onQueryReturned(response: DB_PermissionApi[]): Promise<void> {
		const newApis: TypedMap<DB_PermissionApi[]> = {};
		response.forEach(api => {
			const apiArray = newApis[api.projectId] || (newApis[api.projectId] = []);
			apiArray.push(api);
		});
		this.apis = newApis;
		dispatch_onPermissionsApisLoaded.dispatchUI([]);
	}

	getApis(projectId: string): DB_PermissionApi[] {
		return this.apis[projectId] || [];
	}


}

export const ApiCaller_PermissionsApi = new PermissionsApiModule_Class();
